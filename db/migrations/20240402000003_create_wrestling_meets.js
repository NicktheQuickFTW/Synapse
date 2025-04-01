/**
 * Migration to create wrestling_meets table
 */
exports.up = function(knex) {
  return knex.schema.createTable('wrestling_meets', (table) => {
    table.increments('id').primary();
    table.integer('schedule_id').unsigned().references('id').inTable('wrestling_schedules').onDelete('CASCADE');
    table.integer('home_team_id').unsigned().references('id').inTable('wrestling_teams').nullable();
    table.integer('away_team_id').unsigned().references('id').inTable('wrestling_teams').nullable();
    table.date('meet_date').nullable();
    table.time('meet_time').nullable();
    table.string('venue').nullable();
    table.string('location').nullable();
    table.boolean('is_rivalry').defaultTo(false);
    table.boolean('is_confirmed').defaultTo(false);
    table.integer('home_score').nullable();
    table.integer('away_score').nullable();
    table.jsonb('match_details').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('wrestling_meets');
}; 