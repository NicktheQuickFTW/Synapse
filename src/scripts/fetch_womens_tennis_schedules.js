const axios = require('axios');
const cheerio = require('cheerio');
const knex = require('../db/knex');
const scheduleIds = require('../config/big12_womens_tennis');
require('dotenv').config();

// Function to fetch standings
async function fetchStandings() {
    try {
        const response = await axios.get('https://big12sports.com/standings.aspx?path=wten', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const standings = [];

        // Find the standings table
        $('table.sidearm-table tr:not(.header)').each((i, row) => {
            const columns = $(row).find('td');
            if (columns.length >= 4) {
                const team = $(columns[1]).text().trim();
                const confRecord = $(columns[2]).text().trim();
                const overallRecord = $(columns[4]).text().trim();
                const streak = $(columns[5]).text().trim();

                if (team && confRecord) {
                    const [confWins, confLosses] = confRecord.split('-').map(Number);
                    const [overallWins, overallLosses] = overallRecord.split('-').map(Number);
                    const winPercent = overallWins / (overallWins + overallLosses);

                    standings.push({
                        team,
                        conf_wins: confWins,
                        conf_losses: confLosses,
                        wins: overallWins,
                        losses: overallLosses,
                        win_percent: winPercent,
                        current_streak: streak
                    });
                }
            }
        });

        return standings;
    } catch (error) {
        console.error('Error fetching standings:', error.message);
        return [];
    }
}

// Function to fetch team schedule
async function fetchTeamSchedule(teamName, scheduleId) {
    try {
        const response = await axios.get(`https://big12sports.com/schedule.aspx?schedule=${scheduleId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const games = [];

        // Find the schedule table
        $('table.sidearm-table tbody tr').each((i, row) => {
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
                const isConference = Object.keys(scheduleIds).some(team => 
                    cleanOpponent.includes(team) || 
                    cleanOpponent.toLowerCase().includes(team.toLowerCase())
                );

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

        return games;
    } catch (error) {
        console.error(`Error fetching schedule for ${teamName} (ID: ${scheduleId}):`, error.message);
        return [];
    }
}

async function main() {
    try {
        console.log('\n=== Big 12 Women\'s Tennis Schedule Fetcher ===\n');
        
        // Get standings
        console.log('Fetching standings...');
        const standings = await fetchStandings();
        
        if (standings.length === 0) {
            console.log('No standings data found. Please check the Big 12 website.');
            return;
        }
        
        console.log(`Found ${standings.length} teams in standings`);
        
        // Sort standings by conference wins (descending)
        standings.sort((a, b) => b.conf_wins - a.conf_wins);
        
        // Display standings
        console.log('\nCurrent Big 12 Women\'s Tennis Standings:');
        standings.forEach((team, index) => {
            console.log(`${index + 1}. ${team.team}`);
            console.log(`   Conference: ${team.conf_wins}-${team.conf_losses}`);
            console.log(`   Overall: ${team.wins}-${team.losses}`);
            console.log(`   Streak: ${team.current_streak}`);
            console.log('');
        });

        // Clear existing women's tennis entries from the database
        await knex('tennis_stats')
            .where('sport', 'womens-tennis')
            .del();
        
        console.log('\nCleared existing women\'s tennis data from database');
        
        // Fetch and save each team's schedule
        console.log('\nFetching team schedules...');
        
        for (const [team, scheduleId] of Object.entries(scheduleIds)) {
            console.log(`\nProcessing ${team}...`);
            
            // Find team in standings
            const teamStats = standings.find(s => s.team.includes(team) || team.includes(s.team));
            
            if (!teamStats) {
                console.log(`Could not find ${team} in standings data. Using default values.`);
            }
            
            // Fetch schedule
            const games = await fetchTeamSchedule(team, scheduleId);
            console.log(`Found ${games.length} games for ${team}`);
            
            // Save to database
            try {
                await knex('tennis_stats').insert({
                    sport: 'womens-tennis',
                    team: team,
                    name: team,
                    location: 'Home',
                    wins: teamStats ? teamStats.wins : 0,
                    losses: teamStats ? teamStats.losses : 0,
                    conf_wins: teamStats ? teamStats.conf_wins : 0,
                    conf_losses: teamStats ? teamStats.conf_losses : 0,
                    win_percent: teamStats ? teamStats.win_percent : 0,
                    current_streak: teamStats ? teamStats.current_streak : '',
                    schedule: JSON.stringify(games),
                    updated_at: new Date()
                });
                
                console.log(`✅ Saved ${team} to tennis_stats table`);
                
                if (teamStats) {
                    console.log(`   Conference: ${teamStats.conf_wins}-${teamStats.conf_losses}`);
                    console.log(`   Overall: ${teamStats.wins}-${teamStats.losses}`);
                }
                
                // Display schedule summary
                if (games.length > 0) {
                    console.log(`   Schedule: ${games.length} games (${games.filter(g => g.isConference).length} conference)`);
                    console.log(`   Completed games: ${games.filter(g => g.result !== 'TBD').length}`);
                }
            } catch (error) {
                console.error(`Error saving data for ${team}:`, error.message);
            }
        }
        
        console.log('\n✅ Successfully updated all women\'s tennis team schedules');
        console.log('\nNOTE: Women\'s and men\'s tennis data is kept completely separate.');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await knex.destroy();
    }
}

main(); 