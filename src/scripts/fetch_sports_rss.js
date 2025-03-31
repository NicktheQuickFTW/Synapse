const { fetchRssFeed } = require('../utils/rss_fetcher');

// Replace this URL with the actual RSS feed URL
const RSS_FEED_URL = process.argv[2] || '';

if (!RSS_FEED_URL) {
    console.error('Please provide an RSS feed URL as an argument');
    console.error('Usage: node fetch_sports_rss.js <rss-feed-url>');
    process.exit(1);
}

console.log(`Fetching RSS feed from: ${RSS_FEED_URL}`);

fetchRssFeed(RSS_FEED_URL)
    .then(data => {
        console.log('RSS Feed Content:');
        console.log(JSON.stringify(data, null, 2));
    })
    .catch(error => {
        console.error('Failed to fetch RSS feed:', error);
        process.exit(1);
    }); 