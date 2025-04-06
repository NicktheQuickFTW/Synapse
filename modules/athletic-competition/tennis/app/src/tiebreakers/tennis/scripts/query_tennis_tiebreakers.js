const knex = require('../db/knex');
require('dotenv').config();

async function queryTennisTiebreakers() {
    try {
        console.log('\n=== Big 12 Tennis Tiebreaker Rules ===\n');
        
        // Get all tiebreakers
        const tiebreakers = await knex('tennis_tiebreakers').select('*');
        
        if (tiebreakers.length === 0) {
            console.log('No tiebreaker rules found in the database.');
            return;
        }
        
        console.log(`Found ${tiebreakers.length} tiebreaker rule(s).\n`);
        
        // Display each tiebreaker
        for (const tiebreaker of tiebreakers) {
            console.log(`Rule: ${tiebreaker.name}`);
            console.log(`Description: ${tiebreaker.description}`);
            console.log(`\nDetails:\n${tiebreaker.details}`);
            console.log(`\nApplies to: ${tiebreaker.applies_to_mens ? 'Men\'s Tennis' : ''} ${tiebreaker.applies_to_womens ? (tiebreaker.applies_to_mens ? '& ' : '') + 'Women\'s Tennis' : ''}`);
            console.log(`Last Updated: ${new Date(tiebreaker.updated_at).toLocaleString()}`);
            console.log('\n' + '='.repeat(50) + '\n');
        }
        
        // Important note about separate treatment of men's and women's tennis
        console.log('NOTE: While men\'s and women\'s tennis share the same tiebreaker rules,');
        console.log('their data and statistics are kept completely separate in the system.');
        
    } catch (error) {
        console.error('Error querying tennis tiebreakers:', error);
    } finally {
        await knex.destroy();
    }
}

queryTennisTiebreakers(); 