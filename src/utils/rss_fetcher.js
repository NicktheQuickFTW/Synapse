const axios = require('axios');
const xml2js = require('xml2js');

async function fetchRssFeed(url) {
    try {
        // Fetch the RSS feed
        const response = await axios.get(url);
        
        // Log raw response for debugging
        console.log('Raw XML response:', response.data);
        
        // Parse XML to JSON
        const parser = new xml2js.Parser({
            explicitArray: true, // Keep arrays for consistency
            mergeAttrs: true,
            trim: true,
            explicitRoot: true
        });
        
        const result = await parser.parseStringPromise(response.data);
        
        // Validate the parsed result
        if (!result || !result.rss) {
            throw new Error('Invalid RSS feed format: Missing root RSS element');
        }
        
        if (!result.rss.channel || !Array.isArray(result.rss.channel)) {
            throw new Error('Invalid RSS feed format: Missing or invalid channel element');
        }
        
        return result;
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('HTTP Error:', error.response.status);
            console.error('Response headers:', error.response.headers);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error:', error.message);
        }
        throw error;
    }
}

module.exports = { fetchRssFeed }; 