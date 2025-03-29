/**
 * Migration to add sport metadata tables
 * Adds sport_metadata, basketball_resources, and agent_registry tables
 */
exports.up = function(knex) {
  return knex.schema
    // Sport metadata table
    .createTable('sport_metadata', function(table) {
      table.serial('sport_id').primary();
      table.string('sport_name', 50).unique().notNullable();
      table.string('schema_version', 20);
      table.timestamptz('last_updated');
      table.string('claude_model_version', 20);
    })
    
    // Basketball resources table - extends flextime_matchups for basketball
    .createTable('basketball_resources', function(table) {
      table.uuid('game_id').primary();
      table.string('team_a', 50).notNullable();
      table.string('team_b', 50).notNullable();
      table.numeric('net_impact');
      table.integer('travel_miles');
      table.timestamptz('tv_slot');
      table.integer('sport_id').unsigned();
      table.foreign('sport_id').references('sport_metadata.sport_id');
      
      // Add a relation to flextime_matchups
      table.integer('matchup_id').unsigned();
      table.foreign('matchup_id').references('flextime_matchups.id').onDelete('CASCADE');
    })
    
    // Agent registry table
    .createTable('agent_registry', function(table) {
      table.uuid('agent_id').primary();
      table.integer('sport_id').unsigned();
      table.foreign('sport_id').references('sport_metadata.sport_id');
      table.timestamptz('last_ping');
      table.jsonb('capabilities');
      table.string('agent_type', 50);
      table.boolean('is_active').defaultTo(true);
      table.timestamptz('created_at').defaultTo(knex.fn.now());
      table.timestamptz('updated_at');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('basketball_resources')
    .dropTableIfExists('agent_registry')
    .dropTableIfExists('sport_metadata');
}; 