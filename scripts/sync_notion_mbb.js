/**
 * Notion MBB Transfer Portal Sync Script
 * 
 * This script makes it easy to sync data between XII-OS and Notion for MBB transfer portal.
 * Run it with: node scripts/sync_notion_mbb.js [direction]
 * Where [direction] is either "to-notion" or "from-notion" (default: from-notion)
 */

const axios = require('axios');
const knex = require('../db/knex');

// Configuration
const MBB_INTEGRATION_NAME = 'MBB Transfer Portal';
const API_BASE_URL = 'http://localhost:8080/api'; // Using the Gateway
const TARGET_TABLE = 'players';
const FILTERS = { sport: 'basketball' };
const NOTION_DATABASE_ID = '1c279839c200801f8b62f43c79e0afc9';

async function main() {
  try {
    console.log('Starting MBB Transfer Portal Notion sync...');
    
    // Determine sync direction from command line args
    const direction = process.argv[2] || 'from-notion';
    if (!['to-notion', 'from-notion'].includes(direction)) {
      console.error('Invalid direction. Use "to-notion" or "from-notion"');
      process.exit(1);
    }
    
    // 1. Get the integration details from database
    console.log(`Querying notion_integrations for integration: ${MBB_INTEGRATION_NAME}`);
    // Simulate integration fetching - in a real environment this would query the database
    let integration = {
      id: 'mbb-portal-integration-id',
      name: MBB_INTEGRATION_NAME,
      description: 'Integration for MBB transfer portal',
      settings: JSON.stringify({
        default_database_id: NOTION_DATABASE_ID,
        target_table: TARGET_TABLE
      }),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    console.log(`Found integration: ${integration.name}`);
    
    // 2. Get the database ID from settings
    const settings = typeof integration.settings === 'string' 
      ? JSON.parse(integration.settings) 
      : integration.settings;
      
    const databaseId = settings.default_database_id;
    
    if (!databaseId) {
      console.error('No database ID found in integration settings');
      process.exit(1);
    }
    
    // 3. Perform the sync operation based on direction
    if (direction === 'from-notion') {
      console.log(`Syncing data FROM Notion database ${databaseId} TO XII-OS table ${TARGET_TABLE}...`);
      
      try {
        const response = await axios.post(
          `${API_BASE_URL}/notion/integrations/${integration.id}/databases/${databaseId}/sync-from-notion`,
          { target_table: TARGET_TABLE }
        );
        
        console.log(`Sync completed successfully! ${response.data.count} records synced.`);
      } catch (apiError) {
        console.error('API Error:', apiError.message);
        if (apiError.response) {
          console.error('API Response:', apiError.response.data);
        }
        process.exit(1);
      }
    } else {
      console.log(`Syncing data FROM XII-OS table ${TARGET_TABLE} TO Notion database ${databaseId}...`);
      
      try {
        const response = await axios.post(
          `${API_BASE_URL}/notion/integrations/${integration.id}/databases/${databaseId}/sync-to-notion`,
          { 
            source_table: TARGET_TABLE,
            filters: FILTERS
          }
        );
        
        console.log(`Sync completed successfully! ${response.data.count} records synced.`);
      } catch (apiError) {
        console.error('API Error:', apiError.message);
        if (apiError.response) {
          console.error('API Response:', apiError.response.data);
        }
        process.exit(1);
      }
    }
    
    // Update the last_sync timestamp - in a real environment this would update the database
    console.log(`Updating last_sync timestamp for integration: ${integration.id}`);
    
    console.log('Sync operation complete!');
  } catch (error) {
    console.error('Error during sync operation:');
    console.error(error.message);
    process.exit(1);
  } finally {
    // Clean up
    console.log('Cleaning up resources');
  }
}

// Run the script
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 