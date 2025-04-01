const knex = require('../config/database');

// List of schools and their RSS feed URLs
const SCHOOL_FEEDS = [
    {
        school_name: 'Arizona',
        feed_url: 'https://arizonawildcats.com/rss/womens-tennis.xml',
        feed_type: 'rss'
    },
    {
        school_name: 'Arizona State',
        feed_url: 'https://thesundevils.com/rss/womens-tennis.xml',
        feed_type: 'rss'
    },
    {
        school_name: 'Baylor',
        feed_url: 'https://baylorbears.com/rss/womens-tennis.xml',
        feed_type: 'rss'
    },
    // Add more schools as their RSS feeds become available
    // For schools without RSS feeds, we'll use HTML scraping
    {
        school_name: 'BYU',
        feed_url: 'https://byucougars.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'Cincinnati',
        feed_url: 'https://gobearcats.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'Texas Tech',
        feed_url: 'https://texastech.com/calendar',
        feed_type: 'html'
    }
    // ... add remaining schools
];

async function populateFeeds() {
    try {
        await knex.transaction(async (trx) => {
            // Clear existing feeds
            await trx('school_rss_feeds').del();
            
            // Insert new feeds
            await trx('school_rss_feeds').insert(SCHOOL_FEEDS);
            
            console.log('Successfully populated RSS feeds');
        });
    } catch (error) {
        console.error('Error populating RSS feeds:', error);
        process.exit(1);
    }
}

// Run the script
populateFeeds().then(() => process.exit(0)); 