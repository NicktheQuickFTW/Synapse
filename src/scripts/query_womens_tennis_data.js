const knex = require('../db/knex');
require('dotenv').config();

async function queryWomensTennisData() {
    try {
        console.log('\n=== Big 12 Women\'s Tennis Data (EXCLUSIVELY) ===\n');

        // Get the standings
        const teams = await knex('tennis_stats')
            .where('sport', 'womens-tennis')
            .orderBy(['conf_wins', 'win_percent'], 'desc');

        if (teams.length === 0) {
            console.log('No data found for women\'s tennis');
            return;
        }

        // Get tiebreaker information
        let tiebreakerInfo = null;
        try {
            tiebreakerInfo = await knex('tennis_tiebreakers')
                .where('applies_to_womens', true)
                .andWhere('name', 'Conference Seeding Tiebreaker')
                .first();
        } catch (tbError) {
            console.log('Note: Tiebreaker information not available');
        }

        console.log('Current Women\'s Tennis Standings:');
        console.log('-----------------------------\n');
        
        teams.forEach((team, index) => {
            console.log(`${index + 1}. ${team.team}`);
            console.log(`   Conference: ${team.conf_wins}-${team.conf_losses}`);
            console.log(`   Overall: ${team.wins}-${team.losses} (${(team.win_percent * 100).toFixed(1)}%)`);
            console.log(`   Streak: ${team.current_streak}`);
            console.log('');
        });

        // Display tiebreaker info if available
        if (tiebreakerInfo) {
            console.log('\nSeeding Tiebreaker Information:');
            console.log('------------------------------');
            console.log(tiebreakerInfo.description);
            console.log('For detailed tiebreaker rules, run: node src/scripts/query_tennis_tiebreakers.js');
            console.log('');
        }

        console.log('\nWomen\'s Team Schedules (Conference Games):');
        console.log('-----------------------------------------\n');
        
        // Process each team's schedule
        for (const team of teams) {
            console.log(`\n${team.team} Schedule:`);
            
            try {
                // Handle schedule data whether it's a string or object
                const schedule = typeof team.schedule === 'string' 
                    ? JSON.parse(team.schedule) 
                    : team.schedule;
                
                // Filter for conference games only
                const confGames = schedule.filter(game => game.isConference);
                
                if (confGames.length > 0) {
                    // Group games by month
                    const gamesByMonth = {};
                    
                    confGames.forEach(game => {
                        // Parse the date to get the month
                        let month = "Other"; // Default
                        
                        try {
                            if (game.date.includes('/')) {
                                // MM/DD/YYYY format
                                const [m] = game.date.split('/');
                                const monthInt = parseInt(m);
                                if (!isNaN(monthInt)) {
                                    month = new Date(0, monthInt - 1).toLocaleString('default', { month: 'long' });
                                }
                            } else if (game.date.includes('-')) {
                                // YYYY-MM-DD format
                                const [_, m] = game.date.split('-');
                                const monthInt = parseInt(m);
                                if (!isNaN(monthInt)) {
                                    month = new Date(0, monthInt - 1).toLocaleString('default', { month: 'long' });
                                }
                            }
                        } catch (e) {
                            // Keep default month if date parsing fails
                        }
                        
                        if (!gamesByMonth[month]) {
                            gamesByMonth[month] = [];
                        }
                        
                        gamesByMonth[month].push(game);
                    });
                    
                    // Display games by month
                    Object.entries(gamesByMonth).forEach(([month, games]) => {
                        console.log(`\n  ${month}:`);
                        games.forEach(game => {
                            const result = game.result !== 'TBD' ? ` (${game.result})` : '';
                            console.log(`    ${game.date} vs ${game.opponent}${result}`);
                            console.log(`      Location: ${game.location}`);
                        });
                    });
                } else {
                    console.log('  No conference games found');
                }
            } catch (parseError) {
                console.error(`  Error processing schedule for ${team.team}:`, parseError.message);
            }
            
            console.log('\n---');
        }

        console.log('\nNOTE: This script exclusively shows women\'s tennis data. For men\'s tennis, use the dedicated script for men\'s tennis.');
        console.log('While women\'s and men\'s tennis share the same tiebreaker rules, their data and statistics are kept completely separate.');

    } catch (error) {
        console.error('Error querying women\'s tennis data:', error);
    } finally {
        await knex.destroy();
    }
}

queryWomensTennisData(); 