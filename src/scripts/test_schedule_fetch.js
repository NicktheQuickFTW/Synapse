const knex = require('../config/database');
const cheerio = require('cheerio');
const fs = require('fs');
require('dotenv').config();

async function testScheduleFetch() {
    try {
        console.log('Fetching Texas Tech schedule...');
        
        // Get the schedule URL from database
        const schedule = await knex('school_html_schedules')
            .where('school_name', 'Texas Tech')
            .where('sport', 'baseball')
            .first();

        if (!schedule) {
            console.log('No schedule found in database');
            return;
        }

        console.log(`URL: ${schedule.feed_url}`);

        // Use Claude's fetch tool to get the page content
        const response = await fetch(schedule.feed_url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${schedule.feed_url}: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        console.log('Successfully fetched HTML content');
        console.log('Content length:', html.length);

        // Save HTML for inspection
        fs.writeFileSync('schedule.html', html);
        console.log('Saved HTML to schedule.html');

        // Parse the HTML
        const $ = cheerio.load(html);
        
        // Look for common schedule elements
        console.log('\nSearching for schedule elements:');
        
        const selectors = [
            // Common schedule containers
            '.schedule-container',
            '#schedule-container',
            '.schedule-content',
            '#schedule-content',
            '.schedule-list',
            '#schedule-list',
            
            // Common game/event containers
            '.event-item',
            '.game-item',
            '.schedule-item',
            '.schedule-row',
            '.event-row',
            '.game-row',
            
            // Common schedule sections
            '.schedule-section',
            '#schedule-section',
            '.schedule-wrapper',
            '#schedule-wrapper',
            
            // Specific to sports sites
            '.sports-schedule',
            '.athletic-schedule',
            '.team-schedule',
            '.season-schedule'
        ];

        selectors.forEach(selector => {
            const elements = $(selector);
            if (elements.length > 0) {
                console.log(`\nFound ${elements.length} elements with selector: ${selector}`);
                if (elements.length <= 3) {
                    elements.each((i, el) => {
                        console.log(`\nElement ${i + 1} HTML structure:`);
                        console.log($(el).html().slice(0, 500) + '...');
                    });
                }
            }
        });

        // Look for elements containing schedule-related text
        console.log('\nSearching for elements containing schedule-related text:');
        const scheduleKeywords = ['vs.', 'at', 'game', 'match', 'schedule', 'opponent'];
        
        $('div, li, tr').each((i, el) => {
            const text = $(el).text().toLowerCase();
            if (scheduleKeywords.some(keyword => text.includes(keyword))) {
                const classes = $(el).attr('class') || '';
                const id = $(el).attr('id') || '';
                console.log(`\nFound potential schedule element:`, {
                    classes,
                    id,
                    text: text.slice(0, 100) + '...'
                });
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await knex.destroy();
    }
}

testScheduleFetch(); 