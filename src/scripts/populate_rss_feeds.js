const knex = require('../config/database');

const SCHOOL_FEEDS = [
    {
        school_name: 'Arizona',
        sport: 'womens-tennis',
        feed_url: 'file://./data/arizona_womens_tennis.xml',
        feed_type: 'rss',
        is_active: true
    },
    {
        school_name: 'Arizona',
        sport: 'mens-tennis',
        feed_url: 'file://./data/arizona_mens_tennis.xml',
        feed_type: 'rss',
        is_active: true
    },
    {
        school_name: 'Arizona',
        sport: 'womens-basketball',
        feed_url: 'file://./data/arizona_womens_basketball.xml',
        feed_type: 'rss',
        is_active: true
    },
    {
        school_name: 'Arizona',
        sport: 'mens-basketball',
        feed_url: 'file://./data/arizona_mens_basketball.xml',
        feed_type: 'rss',
        is_active: true
    },
    {
        school_name: 'Arizona State',
        sport: 'womens-tennis',
        feed_url: 'file://./data/arizona_state_womens_tennis.xml',
        feed_type: 'rss',
        is_active: true
    },
    {
        school_name: 'Arizona State',
        sport: 'mens-tennis',
        feed_url: 'file://./data/arizona_state_mens_tennis.xml',
        feed_type: 'rss',
        is_active: true
    },
    {
        school_name: 'Arizona State',
        sport: 'womens-basketball',
        feed_url: 'file://./data/arizona_state_womens_basketball.xml',
        feed_type: 'rss',
        is_active: true
    },
    {
        school_name: 'Arizona State',
        sport: 'mens-basketball',
        feed_url: 'file://./data/arizona_state_mens_basketball.xml',
        feed_type: 'rss',
        is_active: true
    },
    {
        school_name: 'Baylor',
        sport: 'womens-tennis',
        feed_url: 'file://./data/baylor_womens_tennis.xml',
        feed_type: 'rss',
        is_active: true
    },
    {
        school_name: 'Baylor',
        sport: 'mens-tennis',
        feed_url: 'file://./data/baylor_mens_tennis.xml',
        feed_type: 'rss',
        is_active: true
    },
    {
        school_name: 'Baylor',
        sport: 'womens-basketball',
        feed_url: 'file://./data/baylor_womens_basketball.xml',
        feed_type: 'rss',
        is_active: true
    },
    {
        school_name: 'Baylor',
        sport: 'mens-basketball',
        feed_url: 'file://./data/baylor_mens_basketball.xml',
        feed_type: 'rss',
        is_active: true
    },
    {
        school_name: 'Texas Tech',
        sport: 'womens-tennis',
        feed_url: 'https://texastech.com/sports/womens-tennis/schedule',
        feed_type: 'html',
        is_active: true
    },
    {
        school_name: 'Texas Tech',
        sport: 'mens-tennis',
        feed_url: 'https://texastech.com/sports/mens-tennis/schedule',
        feed_type: 'html',
        is_active: true
    },
    {
        school_name: 'Texas Tech',
        sport: 'womens-basketball',
        feed_url: 'https://texastech.com/sports/womens-basketball/schedule',
        feed_type: 'html',
        is_active: true
    },
    {
        school_name: 'Texas Tech',
        sport: 'mens-basketball',
        feed_url: 'https://texastech.com/sports/mens-basketball/schedule',
        feed_type: 'html',
        is_active: true
    }
];

async function populateRssFeeds() {
    try {
        // Clear existing feeds
        await knex('school_rss_feeds').del();

        // Insert new feeds
        await knex('school_rss_feeds').insert(SCHOOL_FEEDS);

        console.log('Successfully populated RSS feeds');
    } catch (error) {
        console.error('Error populating RSS feeds:', error);
        process.exit(1);
    }
}

populateRssFeeds(); 