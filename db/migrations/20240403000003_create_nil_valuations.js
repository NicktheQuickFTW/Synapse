/**
 * Migration to create nil_valuations table
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('nil_valuations', (table) => {
      table.increments('id').primary();
      table.integer('player_id').unsigned().references('id').inTable('players').onDelete('CASCADE');
      
      // Market Value
      table.decimal('market_value_estimate', 10, 2).notNullable();
      
      // Social Media Metrics
      table.integer('twitter_followers').nullable();
      table.decimal('twitter_engagement', 4, 2).nullable();
      table.integer('instagram_followers').nullable();
      table.decimal('instagram_engagement', 4, 2).nullable();
      table.integer('tiktok_followers').nullable();
      table.decimal('tiktok_engagement', 4, 2).nullable();
      
      // Athletic Performance
      table.decimal('athletic_performance_rating', 4, 2).nullable();
      table.text('key_stats').nullable();
      
      // Marketability
      table.decimal('marketability_score', 4, 2).nullable();
      table.text('marketability_notes').nullable();
      
      // Valuation Details
      table.date('valuation_date').notNullable().defaultTo(knex.fn.now());
      table.string('valuation_method').nullable();
      table.string('currency').defaultTo('USD');
      table.jsonb('metadata').nullable();
      table.timestamps(true, true);
    })
    // Add indexes for optimized querying
    .raw('CREATE INDEX IF NOT EXISTS idx_nil_valuations_player ON nil_valuations (player_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_nil_valuations_value ON nil_valuations (market_value_estimate)')
    .raw('CREATE INDEX IF NOT EXISTS idx_nil_valuations_date ON nil_valuations (valuation_date)')
    .raw('CREATE INDEX IF NOT EXISTS idx_nil_valuations_metadata ON nil_valuations USING GIN (metadata)');
};

exports.down = function(knex) {
  return knex.schema
    // Drop indexes
    .raw('DROP INDEX IF EXISTS idx_nil_valuations_player')
    .raw('DROP INDEX IF EXISTS idx_nil_valuations_value')
    .raw('DROP INDEX IF EXISTS idx_nil_valuations_date')
    .raw('DROP INDEX IF EXISTS idx_nil_valuations_metadata')
    // Drop table
    .dropTableIfExists('nil_valuations');
}; 