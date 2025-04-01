const knex = require('../config/database');
require('dotenv').config();

async function addScheduleUrl() {
    try {
        console.log('Adding Texas Tech schedule URL...');
        
        await knex('school_html_schedules').insert({
            school_name: 'Texas Tech',
            sport: 'baseball',
            feed_url: 'https://texastech.com/sports/baseball/schedule',
            feed_type: 'html',
            is_active: true
        });

        console.log('Successfully added schedule URL');
    } catch (error) {
        console.error('Error adding schedule URL:', error);
    } finally {
        await knex.destroy();
    }
}

addScheduleUrl(); 