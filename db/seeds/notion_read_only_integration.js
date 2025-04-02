/**
 * Seed file for read-only Notion integration
 */

exports.seed = async function(knex) {
  // Delete existing entries first
  await knex('notion_integrations').where({ name: 'XII-OS' }).del();
  
  // Insert the integration record
  await knex('notion_integrations').insert([
    {
      name: 'XII-OS',
      token: process.env.NOTION_API_KEY,
      workspace_id: process.env.NOTION_WORKSPACE_ID,
      description: 'Read-only integration for XII-OS',
      active: true,
      settings: JSON.stringify({
        read_only: true,
        sync_interval: '1h',
        permissions: ['read_content', 'read_user_info'],
        target_databases: [], // Will be populated after testing
      }),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
  
  console.log('XII-OS Notion integration seed completed');
}; 