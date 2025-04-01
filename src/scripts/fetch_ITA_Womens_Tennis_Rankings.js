const axios = require('axios');
const cheerio = require('cheerio');
const knex = require('../db/knex'); // Assuming knex config is correctly set up

// URL for ITA Women's D1 National Team Rankings
// Consider making the date dynamic or configurable if needed
const RANKINGS_URL = 'https://colleges.wearecollegetennis.com/rankings?type=national&gender=F&divisionType=DIV1&matchFormat=TEAM&date=2025-03-25';
const SPORT_FILTER = 'womens-tennis'; // The value used in your 'sport' column

async function fetchAndSaveRankings() {
  console.log('\n=== Starting ITA Women\'s Tennis Rankings Fetcher ===\n');
  let rankingsData = [];

  try {
    console.log(`Fetching rankings from ${RANKINGS_URL}...`);
    
    // --- 1. Fetch HTML ---
    // const response = await axios.get(RANKINGS_URL);
    // const html = response.data;
    // console.log('Successfully fetched HTML.');
    
    // --- 2. Parse HTML (using Cheerio) ---
    // const $ = cheerio.load(html);
    // console.log('Parsing HTML to find rankings table...');
    
    // **MANUAL STEP REQUIRED:** Inspect the HTML structure of the rankings page 
    // to find the correct CSS selector for the rankings table and its rows.
    // Example (replace with actual selectors):
    // const tableSelector = 'table.rankings-table-class'; 
    // const rowSelector = 'tr.ranking-row-class';
    // const rankSelector = 'td.rank-column-class';
    // const teamNameSelector = 'td.team-name-column-class a'; // Often team name is inside a link
    
    // $(tableSelector).find(rowSelector).each((index, element) => {
    //   const rankText = $(element).find(rankSelector).text().trim();
    //   const teamNameText = $(element).find(teamNameSelector).text().trim();
      
    //   // Clean and validate data
    //   const rank = parseInt(rankText);
    //   const teamName = teamNameText; // Add any necessary cleaning (e.g., remove prefixes)
      
    //   if (!isNaN(rank) && teamName) {
    //     rankingsData.push({ teamName, rank });
    //     console.log(`Extracted: Rank ${rank} - ${teamName}`);
    //   } else {
    //      console.warn(`Skipping row - could not parse rank/team: Rank='${rankText}', Team='${teamNameText}'`);
    //   }
    // });

    // --- Placeholder Data (REMOVE once parsing works) ---
    console.warn('Using placeholder ranking data. HTML parsing needs implementation.');
    rankingsData = [
        { teamName: 'Texas', rank: 1 }, 
        { teamName: 'Oklahoma State', rank: 5 }, 
        { teamName: 'UCF', rank: 10 },
        // Add more known Big 12 teams if needed for testing
    ];
     // --- End Placeholder Data ---


    if (rankingsData.length === 0) {
      console.warn('No ranking data extracted. Check HTML parsing logic and selectors.');
      return; // Exit if no data
    }

    console.log(`\nExtracted ${rankingsData.length} rankings. Updating database...`);

    // --- 3. Update Database ---
    let updatedCount = 0;
    let notFoundCount = 0;
    
    // Use a transaction for potentially many updates
    await knex.transaction(async trx => {
        for (const item of rankingsData) {
            try {
                const result = await trx('tennis_stats')
                .where({ 
                    team: item.teamName, // Match based on team name from rankings
                    sport: SPORT_FILTER 
                }) 
                .update({
                    ita_rank: item.rank 
                });

                if (result > 0) {
                    console.log(`Updated rank for ${item.teamName} to ${item.rank}`);
                    updatedCount++;
                } else {
                    // Team from rankings not found in our database (or wrong sport filter)
                    console.log(`Team not found or sport mismatch in DB: ${item.teamName}`);
                    notFoundCount++;
                }
            } catch (dbError) {
                console.error(`Error updating rank for ${item.teamName}:`, dbError.message);
                // Optionally re-throw or handle error to stop transaction
                // throw dbError; 
            }
        }
    });

    console.log(`\nFinished updating database. Updated: ${updatedCount}, Not Found/Mismatch: ${notFoundCount}.`);

  } catch (error) {
    console.error('\n--- An error occurred during the rankings fetch process --- ');
    if (error.response) {
      // Axios error
      console.error(`Status: ${error.response.status}`);
      console.error(`Headers: ${JSON.stringify(error.response.headers)}`);
      // console.error(`Data: ${error.response.data}`); // Be careful logging large HTML responses
    } else if (error.request) {
      // Request made but no response received
      console.error(`Request Error: ${error.request}`);
    } else {
      // Other errors (parsing, setup, etc.)
      console.error('Error', error.message);
    }
    console.error(`Stack: ${error.stack}`);
  } finally {
    // Ensure the database connection is closed
    await knex.destroy();
    console.log('Database connection closed.');
  }
}

// Run the main function
fetchAndSaveRankings(); 