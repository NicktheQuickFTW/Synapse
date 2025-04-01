const knex = require('../config/database');
require('dotenv').config();

async function checkTennisTable() {
    try {
        console.log('\n=== Checking Big 12 Women\'s Tennis Database Table ===\n');

        // Check if table exists
        const hasTable = await knex.schema.hasTable('team_stats');
        console.log('team_stats table exists:', hasTable);

        if (hasTable) {
            // Get table structure
            const columns = await knex('team_stats').columnInfo();
            console.log('\nTable Structure:');
            console.log(columns);

            // Get count of tennis records
            const count = await knex('team_stats')
                .where({ sport: 'womens-tennis' })
                .count('* as count')
                .first();
            console.log('\nNumber of tennis records:', count.count);

            // Get sample record
            const sample = await knex('team_stats')
                .where({ sport: 'womens-tennis' })
                .first();
            console.log('\nSample Record:');
            console.log(JSON.stringify(sample, null, 2));
        }

    } catch (error) {
        console.error('Error checking tennis table:', error);
    } finally {
        await knex.destroy();
    }
}

checkTennisTable(); 