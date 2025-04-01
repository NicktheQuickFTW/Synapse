const knex = require('../config/database');
require('dotenv').config();

async function queryTennisData() {
    try {
        console.log('\n=== Big 12 Women\'s Tennis Database Query ===\n');

        // Get all teams ordered by conference rank
        const teams = await knex('team_stats')
            .where({ sport: 'womens-tennis' })
            .orderBy('conf_rank', 'asc');

        console.log('Team Statistics:');
        teams.forEach(team => {
            console.log(`\n${team.name}:`);
            console.log(`Overall: ${team.wins}-${team.losses} (${(team.win_percent * 100).toFixed(1)}%)`);
            console.log(`Conference: ${team.conf_wins}-${team.conf_losses}`);
            console.log(`Points: ${team.points_for.toFixed(1)} for, ${team.points_against.toFixed(1)} against per game (${team.point_differential.toFixed(1)} differential)`);
            if (team.streak) console.log(`Streak: ${team.streak > 0 ? 'W' + team.streak : 'L' + Math.abs(team.streak)}`);
            console.log(`Conference Rank: ${team.conf_rank}`);

            // Parse and display schedule
            const schedule = JSON.parse(team.schedule);
            console.log('\nSchedule:');
            schedule.forEach(game => {
                console.log(`${game.date}: ${game.location} - ${game.opponent}${game.isConference ? ' *' : ''} - ${game.result} ${game.points}-${game.oppPoints}`);
            });
        });

    } catch (error) {
        console.error('Error querying tennis data:', error);
    } finally {
        await knex.destroy();
    }
}

queryTennisData(); 