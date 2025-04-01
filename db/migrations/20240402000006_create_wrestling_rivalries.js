/**
 * Migration to create wrestling_rivalries table
 */
exports.up = function(knex) {
  return knex.schema.createTable('wrestling_rivalries', (table) => {
    table.increments('id').primary();
    table.integer('team_a_id').unsigned().references('id').inTable('wrestling_teams').onDelete('CASCADE');
    table.integer('team_b_id').unsigned().references('id').inTable('wrestling_teams').onDelete('CASCADE');
    table.integer('intensity').unsigned().defaultTo(1).comment('1-10 scale of rivalry intensity');
    table.text('description').nullable();
    table.text('history').nullable();
    table.jsonb('historical_results').nullable();
    table.timestamps(true, true);
    
    // Add a unique constraint to prevent duplicate rivalries
    table.unique(['team_a_id', 'team_b_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('wrestling_rivalries');
}; 