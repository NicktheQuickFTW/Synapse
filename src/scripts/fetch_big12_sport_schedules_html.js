const knex = require('../config/database');
const cheerio = require('cheerio');
const moment = require('moment');
require('dotenv').config();

// Common table selectors for different schools
const TABLE_SELECTORS = {
    // Sidearm Sports (used by many schools)
    sidearm: {
        container: '.sidearm-schedule-games-container',
        game: '.sidearm-schedule-game',
        date: '.sidearm-schedule-game-opponent-date',
        opponent: '.sidearm-schedule-game-opponent-name',
        location: '.sidearm-schedule-game-location',
        result: '.sidearm-schedule-game-result',
        conference: '.sidearm-schedule-game-conference'
    },
    // CBS Sports
    cbs: {
        container: '.schedule-table',
        game: 'tr',
        date: 'td:nth-child(1)',
        opponent: 'td:nth-child(2)',
        location: 'td:nth-child(3)',
        result: 'td:nth-child(4)',
        conference: 'td:nth-child(5)'
    },
    // Generic table
    generic: {
        container: 'table.schedule-table, table.calendar-table, table.results-table',
        game: 'tr',
        date: 'td:nth-child(1)',
        opponent: 'td:nth-child(2)',
        location: 'td:nth-child(3)',
        result: 'td:nth-child(4)',
        conference: 'td:nth-child(5)'
    }
};

// List of Big 12 teams
const BIG12_TEAMS = [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Houston',
    'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma', 'Oklahoma State',
    'TCU', 'Texas', 'Texas Tech', 'UCF', 'West Virginia'
];

async function fetchHTMLSchedule(url, sport) {
    try {
        console.log(`Fetching schedule from ${url}`);
        
        // Use Claude's fetch tool to get the page content
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        
        const $ = cheerio.load(html);
        const games = [];

        // Try each selector pattern
        for (const [pattern, selectors] of Object.entries(TABLE_SELECTORS)) {
            const container = $(selectors.container);
            if (container.length > 0) {
                console.log(`Found schedule table using ${pattern} pattern`);
                
                container.find(selectors.game).each((i, row) => {
                    try {
                        const dateText = $(row).find(selectors.date).text().trim();
                        const opponentText = $(row).find(selectors.opponent).text().trim();
                        const locationText = $(row).find(selectors.location).text().trim();
                        const resultText = $(row).find(selectors.result).text().trim();
                        const conferenceText = $(row).find(selectors.conference).text().trim();

                        // Skip header rows
                        if (!dateText || !opponentText || 
                            dateText.toLowerCase().includes('date') || 
                            opponentText.toLowerCase().includes('opponent')) {
                            return;
                        }

                        const date = parseDate(dateText);
                        if (!date) {
                            console.warn(`Could not parse date: ${dateText}`);
                            return;
                        }

                        // Parse result and score
                        let result = null;
                        let score = null;
                        if (resultText) {
                            const resultMatch = resultText.match(/(W|L|T)(?:,?\s*(\d+-\d+))?/i);
                            if (resultMatch) {
                                result = resultMatch[1].toUpperCase();
                                score = resultMatch[2];
                            }
                        }

                        // Determine if this is a conference game
                        const isConferenceGame = BIG12_TEAMS.includes(opponentText) || 
                                               conferenceText.toLowerCase().includes('big 12') ||
                                               conferenceText.toLowerCase().includes('conference');

                        games.push({
                            date,
                            opponent: opponentText,
                            location: locationText,
                            score,
                            result,
                            sport: sport.toLowerCase(),
                            is_conference: isConferenceGame
                        });
                    } catch (error) {
                        console.error(`Error processing row:`, error);
                    }
                });

                // If we found games with this pattern, break the loop
                if (games.length > 0) {
                    break;
                }
            }
        }

        if (games.length === 0) {
            console.warn(`No games found for ${url}`);
        } else {
            console.log(`Found ${games.length} games`);
            const conferenceGames = games.filter(g => g.is_conference).length;
            console.log(`Conference games: ${conferenceGames}, Non-conference games: ${games.length - conferenceGames}`);
        }

        return games;
    } catch (error) {
        console.error(`Error fetching HTML schedule from ${url}:`, error);
        return [];
    }
}

function parseDate(dateText) {
    // Common date formats
    const formats = [
        'MM/DD/YYYY',
        'MM-DD-YYYY',
        'MMM DD, YYYY',
        'MMMM DD, YYYY',
        'YYYY-MM-DD',
        'MM/DD/YY',
        'MM-DD-YY'
    ];

    // Clean up the date text
    dateText = dateText.replace(/\s+/g, ' ').trim();

    for (const format of formats) {
        const parsed = moment(dateText, format);
        if (parsed.isValid()) {
            return parsed.format('YYYY-MM-DD');
        }
    }

    // Try to extract date from text if standard formats fail
    const dateMatch = dateText.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
    if (dateMatch) {
        const [, month, day, year] = dateMatch;
        const fullYear = year.length === 2 ? (parseInt(year) > 50 ? '19' + year : '20' + year) : year;
        return moment(`${month}/${day}/${fullYear}`, 'MM/DD/YYYY').format('YYYY-MM-DD');
    }

    return null;
}

async function fetchTeamSchedule(team) {
    try {
        const feed = await knex('school_html_schedules')
            .where('school_name', team)
            .first();

        if (!feed) {
            console.log(`No feed found for ${team}`);
            return [];
        }

        let games = [];
        if (feed.feed_type === 'html') {
            games = await fetchHTMLSchedule(feed.feed_url, feed.sport);
        }

        // Filter games to only include Big 12 teams
        const big12Teams = [
            'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Houston',
            'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma', 'Oklahoma State',
            'TCU', 'Texas', 'Texas Tech', 'UCF', 'West Virginia'
        ];

        return games.filter(game => 
            big12Teams.includes(game.opponent) && 
            game.opponent !== team
        );
    } catch (error) {
        console.error(`Error fetching schedule for ${team}:`, error);
        return [];
    }
}

async function main() {
    try {
        console.log('\n=== Starting Big 12 Schedule Scraper ===\n');
        
        // Get all active feeds
        const feeds = await knex('school_html_schedules')
            .where('is_active', true)
            .select('*');

        console.log(`Found ${feeds.length} feeds to process`);
        const errors = [];
        const allGames = [];

        // Process each feed
        for (const feed of feeds) {
            try {
                console.log(`\nProcessing ${feed.sport} schedule for ${feed.school_name}...`);
                console.log(`URL: ${feed.feed_url}`);
                
                const games = await fetchTeamSchedule(feed.school_name);
                
                if (games.length === 0) {
                    errors.push(`No games found for ${feed.school_name} ${feed.sport}`);
                    console.log('❌ No games found');
                    continue;
                }

                // Add school name to each game
                games.forEach(game => {
                    game.school = feed.school_name;
                });

                allGames.push(...games);
                console.log(`✅ Successfully found ${games.length} games`);
                
                // Log the last 5 games
                console.log('\nRecent Games:');
                games.slice(-5).forEach(game => {
                    const result = game.result ? ` (${game.result})` : '';
                    const score = game.score ? ` ${game.score}` : '';
                    const conf = game.is_conference ? ' [CONF]' : '';
                    console.log(`${game.date}: vs ${game.opponent}${result}${score}${conf}`);
                });
            } catch (error) {
                console.error(`Error processing ${feed.school_name}:`, error);
                errors.push(`Error processing ${feed.school_name}: ${error.message}`);
            }
        }

        // Update games in database
        if (allGames.length > 0) {
            console.log('\nUpdating database...');
            await knex('games').del();
            await knex('games').insert(allGames);
            console.log(`✅ Successfully updated ${allGames.length} games in database`);
        }

        // Log any errors
        if (errors.length > 0) {
            console.log('\nErrors encountered:');
            errors.forEach(error => console.log(`❌ ${error}`));
        }

        console.log('\n=== Big 12 Schedule Scraper Complete ===\n');
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Cleaning up...');
    await knex.destroy();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Received SIGINT. Cleaning up...');
    await knex.destroy();
    process.exit(0);
});

main();