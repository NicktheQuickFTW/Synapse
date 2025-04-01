const knex = require('../db/knex');
require('dotenv').config();

async function queryMensTennisData() {
    try {
        console.log('\n=== Big 12 Men\'s Tennis Database Query ===\n');

        // Query all teams ordered by conference rank
        const teams = await knex('team_stats')
            .where('sport', 'mens-tennis')
            .orderBy('conf_rank', 'asc');

        // Display team statistics
        for (const team of teams) {
            console.log(`${team.team}:`);
            console.log(`Overall: ${team.wins}-${team.losses} (${(team.win_percent * 100).toFixed(1)}%)`);
            console.log(`Conference: ${team.conf_wins}-${team.conf_losses}`);
            console.log(`Points: ${team.points_for.toFixed(1)} for, ${team.points_against.toFixed(1)} against per game (${team.point_differential.toFixed(1)} differential)`);
            console.log(`Streak: ${team.streak}`);
            console.log(`Conference Rank: ${team.conf_rank}`);
            console.log('\nSchedule:');

            try {
                // Parse and display schedule
                const schedule = typeof team.schedule === 'string' ? JSON.parse(team.schedule) : team.schedule;
                schedule.forEach(game => {
                    console.log(`${game.date}: ${game.location} - ${game.opponent} - ${game.result}`);
                });
            } catch (error) {
                console.log('Schedule data not available');
            }
            console.log('\n' + '='.repeat(50) + '\n');
        }

    } catch (error) {
        console.error('Error querying men\'s tennis data:', error);
    } finally {
        await knex.destroy();
    }
}

queryMensTennisData(); 