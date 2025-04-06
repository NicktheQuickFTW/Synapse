/**
 * Migration to create transfer portal table for tracking player transfers
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('transfer_portal', (table) => {
      table.increments('id').primary();
      table.integer('player_id').unsigned().references('id').inTable('players').onDelete('CASCADE');
      table.integer('sport_id').unsigned().references('id').inTable('sports').onDelete('CASCADE');
      
      // Transfer Details
      table.string('status').notNullable().comment('Current status in transfer portal (e.g., "Available", "Committed", "Withdrawn")');
      table.date('entry_date').notNullable().comment('Date player entered transfer portal');
      table.date('commitment_date').nullable().comment('Date player committed to new school');
      table.date('withdrawal_date').nullable().comment('Date player withdrew from portal');
      
      // School Information
      table.integer('previous_team_id').unsigned().references('id').inTable('teams').onDelete('SET NULL');
      table.integer('new_team_id').unsigned().references('id').inTable('teams').onDelete('SET NULL');
      
      // Player Details
      table.string('position').nullable();
      table.string('eligibility').nullable();
      table.string('class_year').nullable();
      table.string('height').nullable();
      table.string('weight').nullable();
      table.string('hometown').nullable();
      table.string('high_school').nullable();
      
      // Basketball Specific Stats
      table.jsonb('stats').nullable().comment('Player statistics from previous season');
      table.jsonb('recruiting_info').nullable().comment('Recruiting information and offers');
      table.jsonb('game_logs').nullable().comment('Detailed game logs from previous season');
      table.jsonb('advanced_stats').nullable().comment('Advanced basketball statistics');
      
      // Transfer Specific Information
      table.string('transfer_type').nullable().comment('e.g., "Grad Transfer", "Regular Transfer"');
      table.boolean('is_graduate_transfer').defaultTo(false);
      table.integer('years_remaining').nullable().comment('Years of eligibility remaining');
      table.date('expected_graduation_date').nullable();
      table.jsonb('transfer_history').nullable().comment('Previous transfer history if any');
      
      // Additional Information
      table.text('notes').nullable();
      table.jsonb('social_media').nullable().comment('Social media handles and activity');
      table.jsonb('media_coverage').nullable().comment('Links to media coverage');
      
      // Metadata
      table.jsonb('metadata').nullable();
      table.timestamps(true, true);
    })
    // Add indexes for optimized querying
    .raw('CREATE INDEX IF NOT EXISTS idx_transfer_portal_player ON transfer_portal (player_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_transfer_portal_sport ON transfer_portal (sport_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_transfer_portal_status ON transfer_portal (status)')
    .raw('CREATE INDEX IF NOT EXISTS idx_transfer_portal_teams ON transfer_portal (previous_team_id, new_team_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_transfer_portal_dates ON transfer_portal (entry_date, commitment_date, withdrawal_date)')
    .raw('CREATE INDEX IF NOT EXISTS idx_transfer_portal_transfer_type ON transfer_portal (transfer_type)')
    .raw('CREATE INDEX IF NOT EXISTS idx_transfer_portal_graduate ON transfer_portal (is_graduate_transfer)')
    .raw('CREATE INDEX IF NOT EXISTS idx_transfer_portal_stats ON transfer_portal USING GIN (stats)')
    .raw('CREATE INDEX IF NOT EXISTS idx_transfer_portal_recruiting ON transfer_portal USING GIN (recruiting_info)')
    .raw('CREATE INDEX IF NOT EXISTS idx_transfer_portal_game_logs ON transfer_portal USING GIN (game_logs)')
    .raw('CREATE INDEX IF NOT EXISTS idx_transfer_portal_advanced_stats ON transfer_portal USING GIN (advanced_stats)')
    .raw('CREATE INDEX IF NOT EXISTS idx_transfer_portal_metadata ON transfer_portal USING GIN (metadata)');
};

exports.down = function(knex) {
  return knex.schema
    // Drop indexes
    .raw('DROP INDEX IF EXISTS idx_transfer_portal_player')
    .raw('DROP INDEX IF EXISTS idx_transfer_portal_sport')
    .raw('DROP INDEX IF EXISTS idx_transfer_portal_status')
    .raw('DROP INDEX IF EXISTS idx_transfer_portal_teams')
    .raw('DROP INDEX IF EXISTS idx_transfer_portal_dates')
    .raw('DROP INDEX IF EXISTS idx_transfer_portal_transfer_type')
    .raw('DROP INDEX IF EXISTS idx_transfer_portal_graduate')
    .raw('DROP INDEX IF EXISTS idx_transfer_portal_stats')
    .raw('DROP INDEX IF EXISTS idx_transfer_portal_recruiting')
    .raw('DROP INDEX IF EXISTS idx_transfer_portal_game_logs')
    .raw('DROP INDEX IF EXISTS idx_transfer_portal_advanced_stats')
    .raw('DROP INDEX IF EXISTS idx_transfer_portal_metadata')
    // Drop table
    .dropTableIfExists('transfer_portal');
}; 