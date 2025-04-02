/**
 * Test script for Notion sync demonstration
 */

const NotionService = require('../modules/notion-integration/services/notionService');
const knex = require('../db/knex');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'notion-test-sync' },
  transports: [
    new winston.transports.File({ filename: 'logs/notion-test-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/notion-test-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

async function testNotionSync() {
  try {
    // 1. Initialize Notion service
    const notionService = new NotionService({
      token: process.env.NOTION_API_KEY
    });
    
    // 2. List available databases (read-only test)
    logger.info('Fetching available databases...');
    const databases = await notionService.listDatabases();
    logger.info(`Found ${databases.length} databases`);
    
    // 3. Select first database for testing
    if (databases.length > 0) {
      const testDatabase = databases[0];
      logger.info(`Selected test database: ${testDatabase.title}`);
      
      // 4. Get database schema
      const schema = await notionService.getDatabaseSchema(testDatabase.id);
      logger.info('Database schema:', schema);
      
      // 5. Query first 5 rows (read-only test)
      const rows = await notionService.queryDatabase(testDatabase.id, {
        page_size: 5
      });
      logger.info(`Retrieved ${rows.length} rows for preview`);
      
      // 6. Generate field mappings based on schema
      const fieldMappings = {};
      Object.keys(schema).forEach(field => {
        fieldMappings[field] = field.toLowerCase().replace(/\s+/g, '_');
      });
      
      // 7. Update database config with actual values
      await knex('notion_database_configs')
        .where({ name: 'Test Database Config' })
        .update({
          database_id: testDatabase.id,
          field_mappings: JSON.stringify(fieldMappings)
        });
      
      logger.info('Test sync completed successfully');
      logger.info('Field mappings generated:', fieldMappings);
    } else {
      logger.warn('No databases found in workspace');
    }
  } catch (error) {
    logger.error('Error during test sync:', error);
    throw error;
  }
}

// Run the test if called directly
if (require.main === module) {
  testNotionSync()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
} 