/**
 * Migration to optimize schema with JSON capabilities and proper indexing
 */
exports.up = function(knex) {
  return knex.schema
    // Add GIN indexes for JSONB columns
    .raw('CREATE INDEX IF NOT EXISTS idx_tennis_stats_schedule ON tennis_stats USING GIN (schedule)')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_schedules_parameters ON wrestling_schedules USING GIN (parameters)')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_schedules_schedule_data ON wrestling_schedules USING GIN (schedule_data)')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_schedules_metrics ON wrestling_schedules USING GIN (metrics)')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_teams_metadata ON wrestling_teams USING GIN (metadata)')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_schedule_constraints_constraint_data ON wrestling_schedule_constraints USING GIN (constraint_data)')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_compass_data_detailed_metrics ON wrestling_compass_data USING GIN (detailed_metrics)')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_meets_match_details ON wrestling_meets USING GIN (match_details)')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_rivalries_historical_results ON wrestling_rivalries USING GIN (historical_results)')

    // Add B-tree indexes for frequently queried columns
    .raw('CREATE INDEX IF NOT EXISTS idx_tennis_stats_team ON tennis_stats (team)')
    .raw('CREATE INDEX IF NOT EXISTS idx_tennis_stats_sport ON tennis_stats (sport)')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_teams_name ON wrestling_teams (name)')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_teams_short_name ON wrestling_teams (short_name)')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_schedules_season ON wrestling_schedules (season_start, season_end)')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_meets_date ON wrestling_meets (meet_date)')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_compass_data_analysis_date ON wrestling_compass_data (analysis_date)')

    // Add partial indexes for active records
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_schedules_active ON wrestling_schedules (id) WHERE is_active = true')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_schedule_constraints_active ON wrestling_schedule_constraints (id) WHERE is_active = true')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_meets_confirmed ON wrestling_meets (id) WHERE is_confirmed = true')

    // Add composite indexes for common query patterns
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_meets_teams ON wrestling_meets (home_team_id, away_team_id)')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_meets_schedule ON wrestling_meets (schedule_id, meet_date)')
    .raw('CREATE INDEX IF NOT EXISTS idx_tennis_stats_performance ON tennis_stats (sport, win_percent DESC)')
    .raw('CREATE INDEX IF NOT EXISTS idx_wrestling_compass_scores ON wrestling_compass_data (team_id, composite_score DESC)');
};

exports.down = function(knex) {
  return knex.schema
    // Drop GIN indexes
    .raw('DROP INDEX IF EXISTS idx_tennis_stats_schedule')
    .raw('DROP INDEX IF EXISTS idx_wrestling_schedules_parameters')
    .raw('DROP INDEX IF EXISTS idx_wrestling_schedules_schedule_data')
    .raw('DROP INDEX IF EXISTS idx_wrestling_schedules_metrics')
    .raw('DROP INDEX IF EXISTS idx_wrestling_teams_metadata')
    .raw('DROP INDEX IF EXISTS idx_wrestling_schedule_constraints_constraint_data')
    .raw('DROP INDEX IF EXISTS idx_wrestling_compass_data_detailed_metrics')
    .raw('DROP INDEX IF EXISTS idx_wrestling_meets_match_details')
    .raw('DROP INDEX IF EXISTS idx_wrestling_rivalries_historical_results')

    // Drop B-tree indexes
    .raw('DROP INDEX IF EXISTS idx_tennis_stats_team')
    .raw('DROP INDEX IF EXISTS idx_tennis_stats_sport')
    .raw('DROP INDEX IF EXISTS idx_wrestling_teams_name')
    .raw('DROP INDEX IF EXISTS idx_wrestling_teams_short_name')
    .raw('DROP INDEX IF EXISTS idx_wrestling_schedules_season')
    .raw('DROP INDEX IF EXISTS idx_wrestling_meets_date')
    .raw('DROP INDEX IF EXISTS idx_wrestling_compass_data_analysis_date')

    // Drop partial indexes
    .raw('DROP INDEX IF EXISTS idx_wrestling_schedules_active')
    .raw('DROP INDEX IF EXISTS idx_wrestling_schedule_constraints_active')
    .raw('DROP INDEX IF EXISTS idx_wrestling_meets_confirmed')

    // Drop composite indexes
    .raw('DROP INDEX IF EXISTS idx_wrestling_meets_teams')
    .raw('DROP INDEX IF EXISTS idx_wrestling_meets_schedule')
    .raw('DROP INDEX IF EXISTS idx_tennis_stats_performance')
    .raw('DROP INDEX IF EXISTS idx_wrestling_compass_scores');
}; 