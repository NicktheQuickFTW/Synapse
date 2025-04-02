/**
 * Migration to create tables for all Big 12 sports
 */
exports.up = function(knex) {
  return knex.schema
    // Common tables for all sports
    .createTable('sports', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('code').notNullable().unique();
      table.string('season').notNullable(); // fall, winter, spring
      table.boolean('is_active').defaultTo(true);
      table.jsonb('metadata').nullable();
      table.timestamps(true, true);
    })
    .createTable('teams', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('short_name').notNullable();
      table.string('abbreviation', 20).notNullable();
      table.string('mascot').notNullable();
      table.string('primary_color').notNullable();
      table.string('secondary_color').notNullable();
      table.string('logo_url').nullable();
      table.string('location').notNullable();
      table.decimal('latitude', 10, 4).notNullable();
      table.decimal('longitude', 10, 4).notNullable();
      table.jsonb('metadata').notNullable();
      table.timestamps(true, true);
    })
    .createTable('sport_teams', (table) => {
      table.increments('id').primary();
      table.integer('sport_id').unsigned().references('id').inTable('sports').onDelete('CASCADE');
      table.integer('team_id').unsigned().references('id').inTable('teams').onDelete('CASCADE');
      table.string('conference').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.jsonb('season_stats').nullable();
      table.timestamps(true, true);
      table.unique(['sport_id', 'team_id']);
    })
    .createTable('schedules', (table) => {
      table.increments('id').primary();
      table.integer('sport_id').unsigned().references('id').inTable('sports').onDelete('CASCADE');
      table.integer('home_team_id').unsigned().references('id').inTable('teams').onDelete('CASCADE');
      table.integer('away_team_id').unsigned().references('id').inTable('teams').onDelete('CASCADE');
      table.date('game_date').notNullable();
      table.time('game_time').nullable();
      table.string('venue').nullable();
      table.string('location').nullable();
      table.boolean('is_conference').defaultTo(false);
      table.boolean('is_neutral').defaultTo(false);
      table.boolean('is_tournament').defaultTo(false);
      table.string('tournament_name').nullable();
      table.jsonb('game_details').nullable();
      table.timestamps(true, true);
    })
    .createTable('standings', (table) => {
      table.increments('id').primary();
      table.integer('sport_id').unsigned().references('id').inTable('sports').onDelete('CASCADE');
      table.integer('team_id').unsigned().references('id').inTable('teams').onDelete('CASCADE');
      table.integer('wins').defaultTo(0);
      table.integer('losses').defaultTo(0);
      table.integer('ties').defaultTo(0);
      table.float('win_percentage').defaultTo(0);
      table.integer('conference_wins').defaultTo(0);
      table.integer('conference_losses').defaultTo(0);
      table.integer('conference_ties').defaultTo(0);
      table.float('conference_win_percentage').defaultTo(0);
      table.integer('rank').nullable();
      table.jsonb('stats').nullable();
      table.timestamps(true, true);
      table.unique(['sport_id', 'team_id']);
    })
    .createTable('rivalries', (table) => {
      table.increments('id').primary();
      table.integer('sport_id').unsigned().references('id').inTable('sports').onDelete('CASCADE');
      table.integer('team_a_id').unsigned().references('id').inTable('teams').onDelete('CASCADE');
      table.integer('team_b_id').unsigned().references('id').inTable('teams').onDelete('CASCADE');
      table.integer('intensity').unsigned().defaultTo(1).comment('1-10 scale of rivalry intensity');
      table.text('description').nullable();
      table.jsonb('historical_results').nullable();
      table.timestamps(true, true);
      table.unique(['sport_id', 'team_a_id', 'team_b_id']);
    })
    // Add indexes for optimized querying
    .raw('CREATE INDEX IF NOT EXISTS idx_sports_code ON sports (code)')
    .raw('CREATE INDEX IF NOT EXISTS idx_teams_name ON teams (name)')
    .raw('CREATE INDEX IF NOT EXISTS idx_teams_abbreviation ON teams (abbreviation)')
    .raw('CREATE INDEX IF NOT EXISTS idx_sport_teams_sport ON sport_teams (sport_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_sport_teams_team ON sport_teams (team_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_schedules_sport ON schedules (sport_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_schedules_teams ON schedules (home_team_id, away_team_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules (game_date)')
    .raw('CREATE INDEX IF NOT EXISTS idx_standings_sport ON standings (sport_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_standings_team ON standings (team_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_standings_rank ON standings (rank)')
    .raw('CREATE INDEX IF NOT EXISTS idx_rivalries_sport ON rivalries (sport_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_rivalries_teams ON rivalries (team_a_id, team_b_id)')
    // Add GIN indexes for JSONB columns
    .raw('CREATE INDEX IF NOT EXISTS idx_sports_metadata ON sports USING GIN (metadata)')
    .raw('CREATE INDEX IF NOT EXISTS idx_teams_metadata ON teams USING GIN (metadata)')
    .raw('CREATE INDEX IF NOT EXISTS idx_sport_teams_stats ON sport_teams USING GIN (season_stats)')
    .raw('CREATE INDEX IF NOT EXISTS idx_schedules_details ON schedules USING GIN (game_details)')
    .raw('CREATE INDEX IF NOT EXISTS idx_standings_stats ON standings USING GIN (stats)')
    .raw('CREATE INDEX IF NOT EXISTS idx_rivalries_results ON rivalries USING GIN (historical_results)');
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('rivalries')
    .dropTableIfExists('standings')
    .dropTableIfExists('schedules')
    .dropTableIfExists('sport_teams')
    .dropTableIfExists('teams')
    .dropTableIfExists('sports')
    // Drop indexes
    .raw('DROP INDEX IF EXISTS idx_sports_code')
    .raw('DROP INDEX IF EXISTS idx_teams_name')
    .raw('DROP INDEX IF EXISTS idx_teams_abbreviation')
    .raw('DROP INDEX IF EXISTS idx_sport_teams_sport')
    .raw('DROP INDEX IF EXISTS idx_sport_teams_team')
    .raw('DROP INDEX IF EXISTS idx_schedules_sport')
    .raw('DROP INDEX IF EXISTS idx_schedules_teams')
    .raw('DROP INDEX IF EXISTS idx_schedules_date')
    .raw('DROP INDEX IF EXISTS idx_standings_sport')
    .raw('DROP INDEX IF EXISTS idx_standings_team')
    .raw('DROP INDEX IF EXISTS idx_standings_rank')
    .raw('DROP INDEX IF EXISTS idx_rivalries_sport')
    .raw('DROP INDEX IF EXISTS idx_rivalries_teams')
    .raw('DROP INDEX IF EXISTS idx_sports_metadata')
    .raw('DROP INDEX IF EXISTS idx_teams_metadata')
    .raw('DROP INDEX IF EXISTS idx_sport_teams_stats')
    .raw('DROP INDEX IF EXISTS idx_schedules_details')
    .raw('DROP INDEX IF EXISTS idx_standings_stats')
    .raw('DROP INDEX IF EXISTS idx_rivalries_results');
}; 