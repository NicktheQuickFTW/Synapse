const knex = require('../config/database');
require('dotenv').config();

async function addBig12ScheduleUrl() {
    try {
        console.log('Adding Big 12 schedule URL...');
        
        await knex('school_html_schedules').insert({
            school_name: 'Big 12',
            sport: 'baseball',
            feed_url: 'https://big12sports.com',
            feed_type: 'api',
            is_active: true
        });

        console.log('Successfully added Big 12 schedule URL');
    } catch (error) {
        console.error('Error adding schedule URL:', error);
    } finally {
        await knex.destroy();
    }
}

addBig12ScheduleUrl(); 