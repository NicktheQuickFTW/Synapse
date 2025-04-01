/**
 * Migration to create wrestling_schedules table
 */
exports.up = function(knex) {
  return knex.schema.createTable('wrestling_schedules', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.date('season_start').notNullable();
    table.date('season_end').notNullable();
    table.integer('meets_per_team').notNullable().defaultTo(8);
    table.text('description').nullable();
    table.jsonb('parameters').nullable().comment('JSON with schedule generation parameters');
    table.jsonb('schedule_data').nullable().comment('Full schedule data including all meets');
    table.jsonb('metrics').nullable().comment('Quality metrics for this schedule');
    table.boolean('is_active').defaultTo(false);
    table.boolean('is_finalized').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('wrestling_schedules');
}; 