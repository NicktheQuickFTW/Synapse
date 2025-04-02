/**
 * Seed file for test database configuration
 */

exports.seed = async function(knex) {
  // Delete existing entries first
  await knex('notion_database_configs').where({ name: 'XII-OS Test Config' }).del();
  
  // Get the integration ID
  const integration = await knex('notion_integrations')
    .where({ name: 'XII-OS Main Integration' })
    .first();

  if (!integration) {
    throw new Error('XII-OS Main Integration not found. Please run notion_integration.js seed first.');
  }
  
  // Insert the test database configuration
  await knex('notion_database_configs').insert([
    {
      name: 'XII-OS Test Config',
      integration_id: integration.id, // Use the actual integration ID
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