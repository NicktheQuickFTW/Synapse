/**
 * Transfer Portal Agent
 * 
 * This script collects transfer portal data from On3.com and syncs it to Notion.
 * It uses Puppeteer for web scraping and the Notion API for data syncing.
 */

const puppeteer = require('puppeteer');
const NotionService = require('../modules/notion-integration/services/notionService');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'transfer-portal-agent' },
  transports: [
    new winston.transports.File({ filename: 'logs/transfer-portal-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/transfer-portal-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

class TransferPortalAgent {
  constructor() {
    this.notionService = new NotionService({
      token: process.env.NOTION_API_KEY
    });
    this.databaseId = null;
  }

  /**
   * Initialize the agent
   */
  async initialize() {
    try {
      // Find the transfer portal database in Notion
      const databases = await this.notionService.listDatabases();
      const transferDb = databases.find(db => {
        const title = (db.title[0]?.plain_text || '').toLowerCase();
        return title.includes('transfer portal') && title.includes('basketball');
      });

      if (!transferDb) {
        throw new Error('Transfer portal database not found in Notion');
      }

      this.databaseId = transferDb.id;
      logger.info(`Found transfer portal database: ${transferDb.title[0]?.plain_text}`);
    } catch (error) {
      logger.error('Failed to initialize agent:', error);
      throw error;
    }
  }

  /**
   * Scrape transfer portal data from On3
   */
  async scrapeTransferData() {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--window-size=1920,1080'],
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    });

    try {
      const page = await browser.newPage();
      
      // Set a realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
      
      // Enable request interception
      await page.setRequestInterception(true);
      
      // Handle requests
      page.on('request', request => {
        // Block image and font requests to speed up loading
        if (request.resourceType() === 'image' || request.resourceType() === 'font') {
          request.abort();
        } else {
          request.continue();
        }
      });

      // Navigate to On3's transfer portal page
      logger.info('Navigating to On3 transfer portal page...');
      await page.goto('https://www.on3.com/transfer-portal/basketball/');
      
      // Wait for content to load
      await page.waitForSelector('body', { timeout: 30000 });
      
      // Log the page content for debugging
      const content = await page.content();
      logger.info('Page loaded. Length:', content.length);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-screenshot.png' });
      logger.info('Saved debug screenshot');

      // Check if we need to handle login
      const loginButton = await page.$('.login-button');
      if (loginButton) {
        logger.info('Login required. Please provide On3 credentials in environment variables.');
        // TODO: Implement login flow when credentials are available
        throw new Error('Login required to access transfer portal data');
      }

      // Try different selectors that might contain player data
      const playerData = await page.evaluate(() => {
        // Look for various possible containers
        const containers = [
          '.player-list',
          '.transfer-portal-list',
          '.portal-entries',
          '[data-testid="player-list"]',
          '.players-grid'
        ];

        for (const selector of containers) {
          const container = document.querySelector(selector);
          if (container) {
            // Found a matching container, try to extract player data
            const players = Array.from(container.children).map(el => {
              // Try multiple possible class names/selectors for each field
              const name = el.querySelector('[class*="name"], .player-name, h3')?.textContent?.trim();
              const position = el.querySelector('[class*="position"]')?.textContent?.trim();
              const previousTeam = el.querySelector('[class*="team"], [class*="school"]')?.textContent?.trim();
              const rating = el.querySelector('[class*="rating"], [class*="score"]')?.textContent?.trim();
              const status = el.querySelector('[class*="status"], [class*="commitment"]')?.textContent?.trim();
              
              if (name) {
                return {
                  name,
                  position,
                  previousTeam,
                  rating,
                  status,
                  profileUrl: el.querySelector('a')?.href
                };
              }
              return null;
            }).filter(Boolean);

            if (players.length > 0) {
              return players;
            }
          }
        }
        return null;
      });

      if (!playerData) {
        logger.error('Could not find player data on page');
        throw new Error('No player data found');
      }

      logger.info(`Scraped ${playerData.length} players from On3`);
      return playerData;
    } catch (error) {
      logger.error('Failed to scrape transfer data:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  /**
   * Sync player data to Notion
   */
  async syncToNotion(players) {
    try {
      for (const player of players) {
        // Check if player already exists
        const existingPlayers = await this.notionService.queryDatabase(this.databaseId, {
          filter: {
            property: 'Player',
            title: {
              equals: player.name
            }
          }
        });

        const properties = {
          'Player': {
            title: [{ text: { content: player.name } }]
          },
          'Position': {
            select: { name: player.position }
          },
          'Previous Team': {
            rich_text: [{ text: { content: player.previousTeam } }]
          },
          'On3 Rating': {
            number: parseFloat(player.rating) || null
          },
          'Status': {
            status: {
              name: player.status === 'Committed' ? 'Committed' : 'In Portal'
            }
          },
          'On3 Profile': {
            url: player.profileUrl
          },
          'Last Updated': {
            date: { start: new Date().toISOString() }
          }
        };

        if (existingPlayers.length > 0) {
          // Update existing player
          await this.notionService.updatePage(existingPlayers[0].id, properties);
          logger.info(`Updated player: ${player.name}`);
        } else {
          // Create new player
          await this.notionService.createPage(this.databaseId, properties);
          logger.info(`Created new player: ${player.name}`);
        }
      }

      logger.info('Successfully synced all players to Notion');
    } catch (error) {
      logger.error('Failed to sync to Notion:', error);
      throw error;
    }
  }

  /**
   * Run the agent
   */
  async run() {
    try {
      await this.initialize();
      const players = await this.scrapeTransferData();
      await this.syncToNotion(players);
      logger.info('Transfer portal agent completed successfully');
    } catch (error) {
      logger.error('Transfer portal agent failed:', error);
      throw error;
    }
  }
}

// Run the agent if called directly
if (require.main === module) {
  const agent = new TransferPortalAgent();
  agent.run()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Agent failed:', error);
      process.exit(1);
    });
} 