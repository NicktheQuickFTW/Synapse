const knex = require('../config/database');

const SCHOOL_FEEDS = [
    // Arizona
    {
        school_name: 'Arizona',
        sport: 'tennis',
        feed_url: 'https://arizonawildcats.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'Arizona',
        sport: 'basketball',
        feed_url: 'https://arizonawildcats.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    },
    // Arizona State
    {
        school_name: 'Arizona State',
        sport: 'tennis',
        feed_url: 'https://thesundevils.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'Arizona State',
        sport: 'basketball',
        feed_url: 'https://thesundevils.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    },
    // Baylor
    {
        school_name: 'Baylor',
        sport: 'tennis',
        feed_url: 'https://baylorbears.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'Baylor',
        sport: 'basketball',
        feed_url: 'https://baylorbears.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    },
    // BYU
    {
        school_name: 'BYU',
        sport: 'tennis',
        feed_url: 'https://byucougars.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'BYU',
        sport: 'basketball',
        feed_url: 'https://byucougars.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    },
    // Cincinnati
    {
        school_name: 'Cincinnati',
        sport: 'tennis',
        feed_url: 'https://gobearcats.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'Cincinnati',
        sport: 'basketball',
        feed_url: 'https://gobearcats.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    },
    // Houston
    {
        school_name: 'Houston',
        sport: 'tennis',
        feed_url: 'https://uhcougars.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'Houston',
        sport: 'basketball',
        feed_url: 'https://uhcougars.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    },
    // Iowa State
    {
        school_name: 'Iowa State',
        sport: 'tennis',
        feed_url: 'https://cyclones.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'Iowa State',
        sport: 'basketball',
        feed_url: 'https://cyclones.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    },
    // Kansas
    {
        school_name: 'Kansas',
        sport: 'tennis',
        feed_url: 'https://kuathletics.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'Kansas',
        sport: 'basketball',
        feed_url: 'https://kuathletics.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    },
    // Kansas State
    {
        school_name: 'Kansas State',
        sport: 'tennis',
        feed_url: 'https://www.kstatesports.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'Kansas State',
        sport: 'basketball',
        feed_url: 'https://www.kstatesports.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    },
    // Oklahoma
    {
        school_name: 'Oklahoma',
        sport: 'tennis',
        feed_url: 'https://soonersports.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'Oklahoma',
        sport: 'basketball',
        feed_url: 'https://soonersports.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    },
    // Oklahoma State
    {
        school_name: 'Oklahoma State',
        sport: 'tennis',
        feed_url: 'https://okstate.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'Oklahoma State',
        sport: 'basketball',
        feed_url: 'https://okstate.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    },
    // TCU
    {
        school_name: 'TCU',
        sport: 'tennis',
        feed_url: 'https://gofrogs.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'TCU',
        sport: 'basketball',
        feed_url: 'https://gofrogs.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    },
    // Texas
    {
        school_name: 'Texas',
        sport: 'tennis',
        feed_url: 'https://texassports.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'Texas',
        sport: 'basketball',
        feed_url: 'https://texassports.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    },
    // Texas Tech
    {
        school_name: 'Texas Tech',
        sport: 'tennis',
        feed_url: 'https://texastech.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'Texas Tech',
        sport: 'basketball',
        feed_url: 'https://texastech.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    },
    // UCF
    {
        school_name: 'UCF',
        sport: 'tennis',
        feed_url: 'https://ucfknights.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'UCF',
        sport: 'basketball',
        feed_url: 'https://ucfknights.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    },
    // West Virginia
    {
        school_name: 'West Virginia',
        sport: 'tennis',
        feed_url: 'https://wvusports.com/sports/womens-tennis/schedule',
        feed_type: 'html'
    },
    {
        school_name: 'West Virginia',
        sport: 'basketball',
        feed_url: 'https://wvusports.com/sports/womens-basketball/schedule',
        feed_type: 'html'
    }
];

async function populateFeeds() {
    try {
        // Clear existing feeds
        await knex('school_rss_feeds').del();
        
        // Insert new feeds
        await knex('school_rss_feeds').insert(SCHOOL_FEEDS);
        
        console.log('Successfully populated RSS feeds');
    } catch (error) {
        console.error('Error populating RSS feeds:', error);
    } finally {
        process.exit();
    }
}

populateFeeds(); 