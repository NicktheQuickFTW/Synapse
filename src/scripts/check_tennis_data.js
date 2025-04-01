const knex = require('../db/knex');
require('dotenv').config();

async function checkTennisData() {
    try {
        console.log('\n=== Checking Big 12 Women\'s Tennis Data ===\n');

        // Get a sample record
        const sample = await knex('team_stats')
            .where('sport', 'womens-tennis')
            .first();

        if (sample) {
            console.log('Raw schedule field:');
            console.log(sample.schedule);
            console.log('\nSchedule type:', typeof sample.schedule);
        } else {
            console.log('No tennis data found');
        }

    } catch (error) {
        console.error('Error checking tennis data:', error);
    } finally {
        await knex.destroy();
    }
}

checkTennisData(); 