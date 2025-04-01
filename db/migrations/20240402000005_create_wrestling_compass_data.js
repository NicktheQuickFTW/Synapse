/**
 * Migration to create wrestling_compass_data table
 */
exports.up = function(knex) {
  return knex.schema.createTable('wrestling_compass_data', (table) => {
    table.increments('id').primary();
    table.integer('team_id').unsigned().references('id').inTable('wrestling_teams').onDelete('CASCADE');
    table.float('performance_score').nullable().comment('On-mat performance metric');
    table.float('roster_score').nullable().comment('Roster dynamics metric');
    table.float('infrastructure_score').nullable().comment('Facilities and support metric');
    table.float('prestige_score').nullable().comment('Program history and reputation metric');
    table.float('academics_score').nullable().comment('Academic performance metric');
    table.float('composite_score').nullable().comment('Overall COMPASS score');
    table.jsonb('detailed_metrics').nullable().comment('Detailed breakdown of all metrics');
    table.text('analysis_summary').nullable();
    table.date('analysis_date').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('wrestling_compass_data');
}; 