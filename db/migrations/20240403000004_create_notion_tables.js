/**
 * Migration to create Notion integration tables
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('notion_integrations', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('token').notNullable();
      table.string('workspace_id').notNullable();
      table.string('description').nullable();
      table.boolean('active').defaultTo(true);
      table.jsonb('settings').nullable();
      table.timestamps(true, true);
    })
    .createTable('notion_database_configs', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.integer('integration_id').unsigned().references('id').inTable('notion_integrations').onDelete('CASCADE');
      table.string('database_id').notNullable();
      table.string('sync_direction').notNullable().defaultTo('from_notion');
      table.boolean('sync_enabled').defaultTo(true);
      table.jsonb('field_mappings').notNullable();
      table.string('sync_schedule').nullable();
      table.timestamp('last_synced_at').nullable();
      table.timestamps(true, true);
    })
    // Add indexes for optimized querying
    .raw('CREATE INDEX IF NOT EXISTS idx_notion_integrations_name ON notion_integrations (name)')
    .raw('CREATE INDEX IF NOT EXISTS idx_notion_integrations_workspace ON notion_integrations (workspace_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_notion_integrations_settings ON notion_integrations USING GIN (settings)')
    .raw('CREATE INDEX IF NOT EXISTS idx_notion_database_configs_name ON notion_database_configs (name)')
    .raw('CREATE INDEX IF NOT EXISTS idx_notion_database_configs_integration ON notion_database_configs (integration_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_notion_database_configs_mappings ON notion_database_configs USING GIN (field_mappings)');
};

exports.down = function(knex) {
  return knex.schema
    // Drop indexes
    .raw('DROP INDEX IF EXISTS idx_notion_integrations_name')
    .raw('DROP INDEX IF EXISTS idx_notion_integrations_workspace')
    .raw('DROP INDEX IF EXISTS idx_notion_integrations_settings')
    .raw('DROP INDEX IF EXISTS idx_notion_database_configs_name')
    .raw('DROP INDEX IF EXISTS idx_notion_database_configs_integration')
    .raw('DROP INDEX IF EXISTS idx_notion_database_configs_mappings')
    // Drop tables
    .dropTableIfExists('notion_database_configs')
    .dropTableIfExists('notion_integrations');
}; 