const knex = require('../config/database');
require('dotenv').config();

async function updateSchoolFeeds() {
    try {
        // Clear existing feeds
        await knex('school_rss_feeds').del();

        // Insert new feeds
        const feeds = [
            {
                school_name: 'Texas Tech',
                sport: 'baseball',
                feed_url: 'https://texastech.com/sports/baseball/schedule',
                feed_type: 'html',
                is_active: true
            },
            {
                school_name: 'Texas Tech',
                sport: 'basketball',
                feed_url: 'https://texastech.com/sports/mens-basketball/schedule',
                feed_type: 'html',
                is_active: true
            },
            {
                school_name: 'Texas Tech',
                sport: 'football',
                feed_url: 'https://texastech.com/sports/football/schedule',
                feed_type: 'html',
                is_active: true
            }
        ];

        await knex('school_rss_feeds').insert(feeds);
        console.log('Successfully updated school feeds');
    } catch (error) {
        console.error('Error updating school feeds:', error);
        process.exit(1);
    } finally {
        await knex.destroy();
        process.exit(0);
    }
}

updateSchoolFeeds(); 