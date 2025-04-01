const knex = require('../db/knex');
require('dotenv').config();

async function queryMatches() {
    try {
        // Get all teams' schedules
        const teams = await knex('team_stats')
            .where('sport', 'womens-tennis')
            .select('team', 'schedule');

        console.log('\n=== Big 12 Women\'s Tennis Matches ===\n');
        console.log(`Found ${teams.length} teams in database\n`);

        // Process each team's schedule
        for (const team of teams) {
            console.log(`\n${team.team} Schedule:`);
            
            try {
                const schedule = JSON.parse(team.schedule || '[]');
                
                if (schedule.length > 0) {
                    // Group games by month
                    const gamesByMonth = {};
                    schedule.forEach(game => {
                        const date = new Date(game.date);
                        const month = date.toLocaleString('default', { month: 'long' });
                        if (!gamesByMonth[month]) {
                            gamesByMonth[month] = [];
                        }
                        gamesByMonth[month].push(game);
                    });

                    // Display games by month
                    Object.entries(gamesByMonth).forEach(([month, games]) => {
                        console.log(`\n${month}:`);
                        games.forEach(game => {
                            const confMark = game.isConference ? ' *' : '';
                            const result = game.result !== 'TBD' ? ` (${game.result})` : '';
                            console.log(`  ${game.date} - ${game.opponent}${confMark}${result}`);
                            console.log(`    Location: ${game.location}`);
                        });
                    });
                } else {
                    console.log('No matches scheduled');
                }
            } catch (parseError) {
                console.error(`Error parsing schedule for ${team.team}:`, parseError.message);
            }
            console.log('\n---');
        }

    } catch (error) {
        console.error('Error querying matches:', error);
    } finally {
        await knex.destroy();
    }
}

queryMatches(); 