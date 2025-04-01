/**
 * Migration to create wrestling_schedule_constraints table
 */
exports.up = function(knex) {
  return knex.schema.createTable('wrestling_schedule_constraints', (table) => {
    table.increments('id').primary();
    table.integer('team_id').unsigned().references('id').inTable('wrestling_teams').nullable();
    table.enum('constraint_type', ['blackout_date', 'venue_unavailable', 'travel_restriction', 'rivalry_requirement', 'custom']).notNullable();
    table.date('start_date').nullable();
    table.date('end_date').nullable();
    table.text('description').nullable();
    table.jsonb('constraint_data').nullable().comment('Additional constraint details as JSON');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('wrestling_schedule_constraints');
}; 