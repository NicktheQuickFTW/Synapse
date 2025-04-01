const knex = require('../config/database');
const moment = require('moment');
require('dotenv').config();

// List of Big 12 teams
const BIG12_TEAMS = [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Houston',
    'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma', 'Oklahoma State',
    'TCU', 'Texas', 'Texas Tech', 'UCF', 'West Virginia'
];

async function fetchSchedule(url, sport) {
    try {
        // Construct the URL with the correct path structure
        const baseUrl = url.replace(/\/$/, ''); // Remove trailing slash if present
        const params = new URLSearchParams({
            'path': sport.toLowerCase()
        });
        const fullUrl = `${baseUrl}/calendar.aspx?${params.toString()}`;
        
        console.log(`Fetching schedule from ${fullUrl}`);
        
        const response = await fetch(fullUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch schedule: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        console.log('Successfully fetched HTML content');
        console.log('Content length:', html.length);

        const games = [];

        // Find all scoreboard components in the HTML
        const scoreboardMatches = html.matchAll(/var component = {"type":"scoreboard".*?"data":(\[.*?\]).*?};/gs);
        let foundScoreboard = false;

        for (const match of scoreboardMatches) {
            foundScoreboard = true;
            try {
                const scoreboardData = JSON.parse(match[1]);
                console.log(`Found scoreboard with ${scoreboardData.length} games`);
                
                // Process each game from the scoreboard data
                scoreboardData.forEach(game => {
                    try {
                        // Skip if no date
                        if (!game.date) {
                            console.log('Skipping game due to missing date');
                            return;
                        }

                        // Get team names from school and opponent
                        const homeTeam = game.school?.title;
                        const awayTeam = game.opponent?.title;

                        if (!homeTeam || !awayTeam) {
                            console.log('Skipping game due to missing teams:', { homeTeam, awayTeam });
                            return;
                        }

                        // Parse date
                        const date = moment(game.date).format('YYYY-MM-DD');
                        if (!date) {
                            console.warn(`Could not parse date: ${game.date}`);
                            return;
                        }

                        console.log(`Processing game: ${homeTeam} vs ${awayTeam} on ${date}`);

                        // Skip if neither team is in Big 12
                        if (!BIG12_TEAMS.includes(homeTeam) && !BIG12_TEAMS.includes(awayTeam)) {
                            console.log(`Skipping non-Big 12 game: ${homeTeam} vs ${awayTeam}`);
                            return;
                        }

                        // Parse result and score if game is completed
                        let result = null;
                        let score = null;
                        if (game.status === 'F') { // F means Final
                            const homeScore = game.school?.record?.wins;
                            const awayScore = game.opponent?.record?.wins;
                            if (homeScore !== undefined && awayScore !== undefined) {
                                score = `${homeScore}-${awayScore}`;
                                if (homeScore > awayScore) {
                                    result = 'W';
                                } else if (homeScore < awayScore) {
                                    result = 'L';
                                } else {
                                    result = 'T';
                                }
                            }
                        }

                        // For each Big 12 team in the game, create a record
                        if (BIG12_TEAMS.includes(homeTeam)) {
                            games.push({
                                date,
                                school: homeTeam,
                                opponent: awayTeam,
                                location: game.location || 'Home',
                                score,
                                result,
                                sport: sport.toLowerCase(),
                                is_conference: game.is_conference || false
                            });
                        }
                        if (BIG12_TEAMS.includes(awayTeam)) {
                            games.push({
                                date,
                                school: awayTeam,
                                opponent: homeTeam,
                                location: game.location || 'Away',
                                score: score ? score.split('-').reverse().join('-') : null, // Reverse score for away team
                                result: result ? (result === 'W' ? 'L' : result === 'L' ? 'W' : 'T') : null, // Reverse result for away team
                                sport: sport.toLowerCase(),
                                is_conference: game.is_conference || false
                            });
                        }
                    } catch (error) {
                        console.error(`Error processing game:`, error);
                    }
                });
            } catch (error) {
                console.error('Error parsing scoreboard data:', error);
            }
        }

        if (!foundScoreboard) {
            console.warn('No scoreboard component found in HTML');
        }

        if (games.length === 0) {
            console.warn(`No games found for ${fullUrl}`);
        } else {
            console.log(`Found ${games.length} games`);
        }

        return games;
    } catch (error) {
        console.error(`Error fetching schedule from ${url}:`, error);
        return [];
    }
}

async function main() {
    try {
        console.log('\n=== Starting Big 12 Schedule Scraper ===\n');
        
        // Get all active feeds
        const feeds = await knex('school_html_schedules')
            .where('is_active', true)
            .where('feed_type', 'api')
            .select('*');

        console.log(`Found ${feeds.length} feeds to process`);
        const errors = [];
        const allGames = [];

        // Process each feed
        for (const feed of feeds) {
            try {
                console.log(`\nProcessing ${feed.sport} schedule for ${feed.school_name}...`);
                console.log(`URL: ${feed.feed_url}`);
                
                const games = await fetchSchedule(feed.feed_url, feed.sport);
                
                if (games.length === 0) {
                    errors.push(`No games found for ${feed.school_name} ${feed.sport}`);
                    console.log('❌ No games found');
                    continue;
                }

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

        // Save all games to database
        if (allGames.length > 0) {
            try {
                // Delete existing games for these schools/sports
                const schoolSports = feeds.map(f => ({
                    school: f.school_name,
                    sport: f.sport.toLowerCase()
                }));

                for (const { school, sport } of schoolSports) {
                    await knex('games')
                        .where({ school, sport })
                        .del();
                }

                // Insert new games
                await knex('games').insert(allGames);
                console.log(`\n✅ Successfully saved ${allGames.length} games to database`);
            } catch (error) {
                console.error('Error saving games to database:', error);
                errors.push(`Database error: ${error.message}`);
            }
        }

        // Report results
        console.log('\n=== Scraping Complete ===');
        console.log(`Total games found: ${allGames.length}`);
        console.log(`Errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\nErrors encountered:');
            errors.forEach(error => console.log(`- ${error}`));
        }

    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        await knex.destroy();
    }
}

main(); 