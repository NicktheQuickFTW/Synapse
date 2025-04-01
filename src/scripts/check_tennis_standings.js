const cheerio = require('cheerio');
require('dotenv').config();

async function checkStandings() {
    try {
        const url = 'https://big12sports.com/standings.aspx?path=mten';
        console.log('Fetching Big 12 Men\'s Tennis standings...');
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch standings: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Find the standings table
        $('table tr').each((_, row) => {
            const $row = $(row);
            const team = $row.find('td:first-child').text().trim();
            const record = $row.find('td:nth-child(2)').text().trim();
            const confRecord = $row.find('td:nth-child(3)').text().trim();
            
            if (team && record) {
                console.log(`${team}: ${record} (${confRecord})`);
            }
        });

    } catch (error) {
        console.error('Error fetching standings:', error);
    }
}

checkStandings(); 