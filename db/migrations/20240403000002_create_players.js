/**
 * Migration to create players table
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('players', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('position').nullable();
      table.integer('team_id').unsigned().references('id').inTable('teams').onDelete('CASCADE');
      table.integer('sport_id').unsigned().references('id').inTable('sports').onDelete('CASCADE');
      
      // Physical Attributes
      table.string('height').nullable();
      table.string('weight').nullable();
      
      // Background Info
      table.string('hometown').nullable();
      table.string('high_school').nullable();
      table.string('previous_school').nullable();
      table.string('eligibility').nullable();
      table.string('class_year').nullable();
      
      // Status
      table.string('status').nullable();
      table.date('entered_date').nullable();
      table.decimal('nil_value', 10, 2).nullable();
      table.text('notes').nullable();
      
      // Additional Data
      table.jsonb('stats').nullable();
      table.jsonb('metadata').nullable();
      table.timestamps(true, true);
    })
    // Add indexes for optimized querying
    .raw('CREATE INDEX IF NOT EXISTS idx_players_name ON players (name)')
    .raw('CREATE INDEX IF NOT EXISTS idx_players_team ON players (team_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_players_sport ON players (sport_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_players_stats ON players USING GIN (stats)')
    .raw('CREATE INDEX IF NOT EXISTS idx_players_metadata ON players USING GIN (metadata)');
};

exports.down = function(knex) {
  return knex.schema
    // Drop indexes
    .raw('DROP INDEX IF EXISTS idx_players_name')
    .raw('DROP INDEX IF EXISTS idx_players_team')
    .raw('DROP INDEX IF EXISTS idx_players_sport')
    .raw('DROP INDEX IF EXISTS idx_players_stats')
    .raw('DROP INDEX IF EXISTS idx_players_metadata')
    // Drop table
    .dropTableIfExists('players');
}; 