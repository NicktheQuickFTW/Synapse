const cheerio = require('cheerio');
const fs = require('fs');
require('dotenv').config();

async function testBig12Schedule() {
    try {
        const baseUrl = 'https://big12sports.com/calendar.aspx';
        const params = new URLSearchParams({
            'path': 'baseball',
            'school': 'Texas Tech'  // We can filter by school
        });

        const url = `${baseUrl}?${params.toString()}`;
        console.log('Fetching from URL:', url);

        // Use Claude's fetch tool to get the page content
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        console.log('Successfully fetched HTML content');
        console.log('Content length:', html.length);

        // Save HTML for inspection
        fs.writeFileSync('big12_schedule.html', html);
        console.log('Saved HTML to big12_schedule.html');

        // Parse the HTML
        const $ = cheerio.load(html);

        // Look for script tags that might contain calendar data or API endpoints
        console.log('\nLooking for relevant script tags:');
        $('script').each((i, el) => {
            const content = $(el).html();
            if (content && (
                content.includes('calendar') || 
                content.includes('schedule') || 
                content.includes('api') ||
                content.includes('export') ||
                content.includes('download')
            )) {
                console.log(`\nScript ${i + 1}:`);
                console.log(content.slice(0, 500) + '...');
            }
        });

        // Look for data attributes that might contain API endpoints
        console.log('\nLooking for data attributes:');
        $('[data-url], [data-api], [data-endpoint], [data-source]').each((i, el) => {
            const attrs = $(el).attr();
            console.log('Found element with data attributes:', attrs);
        });

        // Look for form elements that might handle exports
        console.log('\nLooking for form elements:');
        $('form').each((i, el) => {
            const id = $(el).attr('id') || '';
            const action = $(el).attr('action') || '';
            const method = $(el).attr('method') || '';
            if (action.includes('calendar') || action.includes('schedule') || 
                action.includes('export') || action.includes('download') ||
                id.includes('calendar') || id.includes('schedule')) {
                console.log('Found form:', {
                    id,
                    action,
                    method
                });
            }
        });

        // Look for iframes that might contain the schedule
        console.log('\nLooking for iframes:');
        $('iframe').each((i, el) => {
            const src = $(el).attr('src') || '';
            const id = $(el).attr('id') || '';
            console.log('Found iframe:', {
                id,
                src
            });
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

testBig12Schedule(); 