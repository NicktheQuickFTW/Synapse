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

// Custom field mappings for different database types
const CUSTOM_MAPPINGS = {
  'Projects': {
    'Project name': 'name',
    'Status': 'status',
    'Priority': 'priority',
    'Owner': 'assigned_to',
    'Teams': 'team',
    'Summary': 'description',
    'Launch date': 'due_date',
    'Tag': 'category',
    'Tasks': 'subtasks',
    'Completion': 'progress',
    'Dates': 'timeline',
    'Is Blocking': 'blocking_tasks',
    'Blocked By': 'blocked_by_tasks'
  },
  'Players': {
    'Name': 'name',
    'Position': 'position',
    'Team': 'team',
    'Status': 'status',
    'NIL Value': 'nil_value',
    'Class': 'class_year',
    'Eligibility': 'eligibility',
    'Height': 'height',
    'Weight': 'weight',
    'Hometown': 'hometown',
    'High School': 'high_school',
    'Previous School': 'previous_school',
    'Stats': 'stats',
    'Notes': 'notes'
  },
  'Teams': {
    'Name': 'name',
    'Conference': 'conference',
    'Division': 'division',
    'Location': 'location',
    'Stadium': 'stadium',
    'Mascot': 'mascot',
    'Colors': 'colors',
    'Head Coach': 'head_coach',
    'Staff': 'staff',
    'Budget': 'budget',
    'Revenue': 'revenue',
    'Expenses': 'expenses'
  }
};

async function testNotionSync(targetDatabaseName = null) {
  try {
    // 1. Initialize Notion service
    const notionService = new NotionService({
      token: process.env.NOTION_API_KEY
    });
    
    // 2. List available databases (read-only test)
    logger.info('Fetching available databases...');
    const databases = await notionService.listDatabases();
    logger.info(`Found ${databases.length} databases`);
    
    // Log all database titles for debugging
    const databaseTitles = databases.map(db => db.title[0]?.plain_text || 'Untitled').filter(Boolean);
    logger.info('Available databases:', databaseTitles);
    
    // 3. Select database for testing
    let testDatabase = null;
    if (targetDatabaseName) {
      // More flexible search - match any part of the name
      testDatabase = databases.find(db => {
        const title = (db.title[0]?.plain_text || '').toLowerCase();
        const searchTerms = targetDatabaseName.toLowerCase().split(' ');
        return searchTerms.some(term => title.includes(term));
      });

      if (!testDatabase) {
        throw new Error(`No database found matching "${targetDatabaseName}". Available databases: ${databaseTitles.join(', ')}`);
      }
    } else {
      testDatabase = databases[0];
    }
    
    const dbTitle = testDatabase.title[0]?.plain_text || 'Unknown';
    logger.info(`Selected test database: ${dbTitle}`);
    
    // 4. Get database schema
    const schema = await notionService.getDatabaseSchema(testDatabase.id);
    logger.info('Database schema:', schema);
    
    // 5. Query first 5 rows (read-only test)
    const rows = await notionService.queryDatabase(testDatabase.id, {
      page_size: 5
    });
    logger.info(`Retrieved ${rows.length} rows for preview`);
    
    // 6. Generate field mappings based on schema and database type
    let fieldMappings = {};
    
    // Try to determine database type from title
    const dbType = Object.keys(CUSTOM_MAPPINGS).find(type => 
      dbTitle.toLowerCase().includes(type.toLowerCase())
    );
    
    if (dbType && CUSTOM_MAPPINGS[dbType]) {
      // Use custom mappings if available
      fieldMappings = CUSTOM_MAPPINGS[dbType];
      logger.info(`Using custom mappings for ${dbType} database`);
    } else {
      // Fall back to automatic mappings
      Object.keys(schema).forEach(field => {
        fieldMappings[field] = field.toLowerCase().replace(/\s+/g, '_');
      });
      logger.info('Using automatic field mappings');
    }
    
    // 7. Update database config with actual values
    await knex('notion_database_configs')
      .where({ name: 'Test Database Config' })
      .update({
        database_id: testDatabase.id,
        field_mappings: JSON.stringify(fieldMappings)
      });
    
    logger.info('Test sync completed successfully');
    logger.info('Field mappings generated:', fieldMappings);
  } catch (error) {
    logger.error('Error during test sync:', error);
    throw error;
  }
}

// Run the test if called directly
if (require.main === module) {
  // You can specify a target database name as a command line argument
  const targetDatabase = process.argv[2];
  testNotionSync(targetDatabase)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
} 