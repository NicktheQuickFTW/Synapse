/**
 * Migration to create wrestling_teams table
 */
exports.up = function(knex) {
  return knex.schema.createTable('wrestling_teams', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('short_name', 10).notNullable();
    table.string('abbreviation', 5).notNullable();
    table.string('mascot').nullable();
    table.string('primary_color', 7).nullable();
    table.string('secondary_color', 7).nullable();
    table.string('logo_url').nullable();
    table.string('location').nullable();
    table.float('latitude').nullable();
    table.float('longitude').nullable();
    table.integer('wins').defaultTo(0);
    table.integer('losses').defaultTo(0);
    table.text('description').nullable();
    table.jsonb('metadata').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('wrestling_teams');
}; 