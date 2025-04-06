/**
 * Migration to create GitHub project tables
 * 
 * @param {object} knex - Knex instance
 * @returns {Promise} Promise
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('github_projects', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('description');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('github_repositories', function(table) {
      table.increments('id').primary();
      table.integer('project_id').unsigned().references('id').inTable('github_projects').onDelete('CASCADE');
      table.string('repo_url').notNullable();
      table.string('owner').notNullable();
      table.string('repo_name').notNullable();
      table.text('description');
      table.integer('stars').defaultTo(0);
      table.string('language');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

/**
 * Rollback the migration
 * 
 * @param {object} knex - Knex instance
 * @returns {Promise} Promise
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('github_repositories')
    .dropTableIfExists('github_projects');
}; 