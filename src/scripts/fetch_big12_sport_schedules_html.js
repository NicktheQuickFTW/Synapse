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
        const matches = [];

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

                        matches.push({
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

                // If we found matches with this pattern, break the loop
                if (matches.length > 0) {
                    break;
                }
            }
        }

        if (matches.length === 0) {
            console.warn(`No matches found for ${url}`);
        } else {
            console.log(`Found ${matches.length} matches`);
            const conferenceGames = matches.filter(m => m.is_conference).length;
            console.log(`Conference games: ${conferenceGames}, Non-conference games: ${matches.length - conferenceGames}`);
        }

        return matches;
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
        const feed = await knex('school_rss_feeds')
            .where('school_name', team)
            .first();

        if (!feed) {
            console.log(`No feed found for ${team}`);
            return [];
        }

        let matches = [];
        if (feed.feed_type === 'html') {
            matches = await fetchHTMLSchedule(feed.feed_url, feed.sport);
        }

        // Filter matches to only include Big 12 teams
        const big12Teams = [
            'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Houston',
            'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma', 'Oklahoma State',
            'TCU', 'Texas', 'Texas Tech', 'UCF', 'West Virginia'
        ];

        return matches.filter(match => 
            big12Teams.includes(match.opponent) && 
            match.opponent !== team
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
        const feeds = await knex('school_rss_feeds')
            .where('is_active', true)
            .select('*');

        console.log(`Found ${feeds.length} feeds to process`);
        const errors = [];
        const allMatches = [];

        // Process each feed
        for (const feed of feeds) {
            try {
                console.log(`\nProcessing ${feed.sport} schedule for ${feed.school_name}...`);
                console.log(`URL: ${feed.feed_url}`);
                
                const matches = await fetchTeamSchedule(feed.school_name);
                
                if (matches.length === 0) {
                    errors.push(`No matches found for ${feed.school_name} ${feed.sport}`);
                    console.log('❌ No matches found');
                    continue;
                }

                // Add school name to each match
                matches.forEach(match => {
                    match.school = feed.school_name;
                });

                allMatches.push(...matches);
                console.log(`✅ Successfully found ${matches.length} matches`);
                
                // Log match details
                console.log('\nMatch Details:');
                matches.forEach(match => {
                    console.log(`- ${match.date}: ${match.school} vs ${match.opponent} (${match.is_conference ? 'Conference' : 'Non-Conference'})`);
                });
                
            } catch (error) {
                errors.push(`Error processing ${feed.school_name} ${feed.sport}: ${error.message}`);
                console.error(`❌ Error: ${error.message}`);
            }
        }

        // Update matches in database
        if (allMatches.length > 0) {
            console.log('\nUpdating database...');
            await knex('matches').del();
            await knex('matches').insert(allMatches);
            console.log(`✅ Successfully updated ${allMatches.length} matches in database`);
        }

        // Log any errors
        if (errors.length > 0) {
            console.error('\n❌ Errors encountered:');
            errors.forEach(error => console.error(`- ${error}`));
        }

        console.log('\n=== Big 12 Schedule Scraper Complete ===\n');

    } catch (error) {
        console.error('❌ Error in main process:', error);
        process.exit(1);
    } finally {
        await knex.destroy();
        process.exit(0);
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