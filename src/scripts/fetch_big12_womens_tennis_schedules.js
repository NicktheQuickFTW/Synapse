const axios = require('axios');
const cheerio = require('cheerio');
const knex = require('../db/knex');
const scheduleIds = require('../config/big12_womens_tennis');
require('dotenv').config();

async function fetchTeamSchedule(scheduleId) {
    try {
        const response = await axios.get(`https://big12sports.com/schedule.aspx?schedule=${scheduleId}`);
        const $ = cheerio.load(response.data);
        const games = [];

        // Find the schedule table
        $('table.sidearm-table').each((i, table) => {
            $(table).find('tr:not(.header)').each((j, row) => {
                const columns = $(row).find('td');
                if (columns.length >= 4) {
                    const date = $(columns[0]).text().trim();
                    const opponent = $(columns[1]).text().trim();
                    const location = $(columns[2]).text().trim();
                    const result = $(columns[3]).text().trim();

                    // Clean up the opponent name
                    let cleanOpponent = opponent
                        .replace(/^vs\.?\s*/, '')
                        .replace(/^@\s*/, '')
                        .replace(/\s+/g, ' ')
                        .trim();

                    // Determine if it's a conference game
                    const isConference = cleanOpponent.includes('Big 12') || 
                                       Object.keys(scheduleIds).some(team => cleanOpponent.includes(team));

                    if (date && cleanOpponent) {
                        games.push({
                            date,
                            opponent: cleanOpponent,
                            location: location || 'Home',
                            result: result || 'TBD',
                            isConference
                        });
                    }
                }
            });
        });

        return games;
    } catch (error) {
        console.error(`Error fetching schedule for ID ${scheduleId}:`, error.message);
        return [];
    }
}

async function main() {
    try {
        console.log('\n=== Starting Big 12 Women\'s Tennis Schedule Fetcher ===\n');
        
        // Delete existing entries for this sport
        await knex('team_stats')
            .where('sport', 'womens-tennis')
            .del();
        
        console.log('Cleared existing women\'s tennis entries');

        for (const [team, scheduleId] of Object.entries(scheduleIds)) {
            console.log(`\nFetching schedule for ${team}...`);
            const games = await fetchTeamSchedule(scheduleId);
            
            if (games.length > 0) {
                console.log(`Found ${games.length} games for ${team}`);
                
                // Calculate stats
                const confGames = games.filter(g => g.isConference && g.result !== 'TBD');
                const allGames = games.filter(g => g.result !== 'TBD');
                
                const confWins = confGames.filter(g => g.result.startsWith('W')).length;
                const confLosses = confGames.filter(g => g.result.startsWith('L')).length;
                const totalWins = allGames.filter(g => g.result.startsWith('W')).length;
                const totalLosses = allGames.filter(g => g.result.startsWith('L')).length;
                
                // Convert schedule to string
                const scheduleStr = JSON.stringify(games);
                
                // Save to database
                await knex('team_stats').insert({
                    sport: 'womens-tennis',
                    team: team,
                    name: team,
                    location: 'Home',
                    wins: totalWins || 0,
                    losses: totalLosses || 0,
                    conf_wins: confWins || 0,
                    conf_losses: confLosses || 0,
                    win_percent: totalWins / (totalWins + totalLosses) || 0,
                    points_for: 0,
                    points_against: 0,
                    point_differential: 0,
                    streak: '0',
                    schedule: scheduleStr,
                    updated_at: new Date()
                });

                console.log(`✅ Saved ${team} to database`);
                console.log(`   Conference: ${confWins}-${confLosses}`);
                console.log(`   Overall: ${totalWins}-${totalLosses}`);
            } else {
                console.log(`No games found for ${team}`);
            }
        }

        console.log('\n✅ Successfully updated all team statistics');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await knex.destroy();
    }
}

main(); 