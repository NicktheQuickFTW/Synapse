/**
 * Seed file for test database configuration
 */

exports.seed = async function(knex) {
  // Delete existing entries first
  await knex('notion_database_configs').where({ name: 'XII-OS Test Config' }).del();
  
  // Insert the test database configuration
  await knex('notion_database_configs').insert([
    {
      name: 'XII-OS Test Config',
      integration_id: 1, // Will be linked to the XII-OS integration
      database_id: 'test_database_id', // Will be updated with actual database ID
      sync_direction: 'from_notion', // Only pull data from Notion
      sync_enabled: true,
      field_mappings: JSON.stringify({
        // Example mappings - will be updated based on actual database structure
        'Notion Field': 'xii_os_field',
        'Title': 'name',
        'Description': 'description'
      }),
      sync_schedule: '0 * * * *', // Sync every hour
      last_synced_at: null,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
  
  console.log('XII-OS test database configuration seed completed');
}; 