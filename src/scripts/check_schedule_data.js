const knex = require('../db/knex');
require('dotenv').config();

async function checkScheduleData() {
    try {
        // Get a sample team's schedule
        const team = await knex('team_stats')
            .where('sport', 'womens-tennis')
            .first();

        if (team) {
            console.log('\nSchedule data type:', typeof team.schedule);
            console.log('Schedule raw value:', team.schedule);
            console.log('\nTrying to parse schedule...');
            try {
                const parsed = JSON.parse(team.schedule);
                console.log('Successfully parsed schedule. First game:', parsed[0]);
            } catch (parseError) {
                console.error('Failed to parse schedule:', parseError.message);
            }
        } else {
            console.log('No team found in database');
        }

    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await knex.destroy();
    }
}

checkScheduleData(); 