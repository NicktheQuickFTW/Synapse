/**
 * Seed file for Notion integration
 */

exports.seed = async function(knex) {
  // Delete existing entries first
  await knex('notion_integrations').where({ name: 'XII-OS Main Integration' }).del();
  
  // Insert the integration record
  await knex('notion_integrations').insert([
    {
      name: 'XII-OS Main Integration',
      token: process.env.NOTION_API_KEY,
      workspace_id: process.env.NOTION_WORKSPACE_ID,
      description: 'Main Notion integration for XII-OS',
      active: true,
      settings: JSON.stringify({
        sync_interval: '1h', // Sync every hour
        target_databases: [], // Will be populated with your database IDs
      }),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
  
  console.log('Notion integration seed completed');
}; 