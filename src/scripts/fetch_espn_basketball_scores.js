const knex = require('../config/database');
const moment = require('moment');
require('dotenv').config();

// List of Big 12 teams
const BIG12_TEAMS = [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Houston',
    'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma', 'Oklahoma State',
    'TCU', 'Texas', 'Texas Tech', 'UCF', 'West Virginia'
];

async function fetchESPNBasketballScores() {
    try {
        const url = 'http://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';
        console.log('Fetching scores from ESPN API...');
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch scores: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Successfully fetched data from ESPN API');
        console.log('Events found:', data.events?.length || 0);
        
        const games = [];

        // Process each event from the API response
        if (data.events) {
            data.events.forEach(event => {
                try {
                    // Get the teams
                    const homeTeam = event.competitions[0]?.competitors?.find(c => c.homeAway === 'home')?.team;
                    const awayTeam = event.competitions[0]?.competitors?.find(c => c.homeAway === 'away')?.team;

                    if (!homeTeam || !awayTeam) {
                        console.log('Skipping event due to missing team data');
                        return;
                    }

                    // Get the full school names
                    const homeSchool = homeTeam.displayName || homeTeam.name;
                    const awaySchool = awayTeam.displayName || awayTeam.name;

                    console.log(`\nProcessing game: ${homeSchool} vs ${awaySchool}`);

                    // Skip if neither team is in Big 12
                    if (!BIG12_TEAMS.includes(homeSchool) && !BIG12_TEAMS.includes(awaySchool)) {
                        console.log('Skipping non-Big 12 game');
                        return;
                    }

                    // Get the scores
                    const homeScore = event.competitions[0]?.competitors?.find(c => c.homeAway === 'home')?.score;
                    const awayScore = event.competitions[0]?.competitors?.find(c => c.homeAway === 'away')?.score;

                    // Get the game status and date
                    const status = event.status;
                    const date = moment(event.date).format('YYYY-MM-DD');

                    // Get conference game status if available
                    const isConference = event.competitions[0]?.conferenceCompetition || false;

                    // Determine if game is completed
                    const isCompleted = status.type.state === 'post';
                    let result = null;
                    let score = null;

                    if (isCompleted && homeScore !== undefined && awayScore !== undefined) {
                        score = `${homeScore}-${awayScore}`;
                        if (parseInt(homeScore) > parseInt(awayScore)) {
                            result = 'W';
                        } else if (parseInt(homeScore) < parseInt(awayScore)) {
                            result = 'L';
                        } else {
                            result = 'T';
                        }
                    }

                    // For each Big 12 team in the game, create a record
                    if (BIG12_TEAMS.includes(homeSchool)) {
                        games.push({
                            date,
                            school: homeSchool,
                            opponent: awaySchool,
                            location: 'Home',
                            score,
                            result,
                            sport: 'basketball',
                            is_conference: isConference
                        });
                    }
                    if (BIG12_TEAMS.includes(awaySchool)) {
                        games.push({
                            date,
                            school: awaySchool,
                            opponent: homeSchool,
                            location: 'Away',
                            score: score ? score.split('-').reverse().join('-') : null, // Reverse score for away team
                            result: result ? (result === 'W' ? 'L' : result === 'L' ? 'W' : 'T') : null, // Reverse result for away team
                            sport: 'basketball',
                            is_conference: isConference
                        });
                    }
                } catch (error) {
                    console.error(`Error processing event:`, error);
                }
            });
        }

        if (games.length === 0) {
            console.warn('No games found in ESPN API response');
        } else {
            console.log(`\nFound ${games.length} games`);
            // Log sample of games found
            console.log('\nSample of games found:');
            games.slice(0, 3).forEach(game => {
                console.log(`${game.date}: ${game.school} ${game.location === 'Home' ? 'vs' : '@'} ${game.opponent}${game.score ? ` (${game.score})` : ''}`);
            });
        }

        return games;
    } catch (error) {
        console.error('Error fetching scores from ESPN API:', error);
        return [];
    }
}

async function main() {
    try {
        console.log('\n=== Starting ESPN Basketball Score Fetcher ===\n');
        
        const games = await fetchESPNBasketballScores();
        
        if (games.length === 0) {
            console.log('❌ No games found');
            return;
        }

        console.log(`✅ Successfully found ${games.length} games`);
        
        // Log the last 5 games
        console.log('\nRecent Games:');
        games.slice(-5).forEach(game => {
            const result = game.result ? ` (${game.result})` : '';
            const score = game.score ? ` ${game.score}` : '';
            const conf = game.is_conference ? ' [CONF]' : '';
            console.log(`${game.date}: ${game.school} ${game.location === 'Home' ? 'vs' : '@'} ${game.opponent}${result}${score}${conf}`);
        });

        // Save games to database
        try {
            // Delete existing basketball games
            await knex('games')
                .where({ sport: 'basketball' })
                .del();

            // Insert new games
            await knex('games').insert(games);
            console.log(`\n✅ Successfully saved ${games.length} games to database`);
        } catch (error) {
            console.error('Error saving games to database:', error);
        }

        console.log('\n=== Fetch Complete ===');
        console.log(`Total games found: ${games.length}`);

    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        await knex.destroy();
    }
}

main(); 