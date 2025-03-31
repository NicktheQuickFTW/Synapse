exports.up = function(knex) {
  return knex.schema
    .createTable('tennis_standings', table => {
      table.increments('id').primary();
      table.string('team_name').notNullable();
      table.integer('wins').notNullable();
      table.integer('losses').notNullable();
      table.decimal('win_pct', 4, 3).notNullable();
      table.integer('ita_rank').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('tennis_matches', table => {
      table.increments('id').primary();
      table.string('home_team').notNullable();
      table.string('away_team').notNullable();
      table.date('match_date').notNullable();
      table.string('location').notNullable();
      table.string('winner').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('tennis_head_to_head', table => {
      table.increments('id').primary();
      table.string('team1').notNullable();
      table.string('team2').notNullable();
      table.string('winner').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('tennis_seedings', table => {
      table.increments('id').primary();
      table.integer('seed').notNullable();
      table.string('team').notNullable();
      table.string('record').notNullable();
      table.decimal('win_pct', 4, 3).notNullable();
      table.string('tiebreaker').nullable();
      table.json('scenario_data').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('tennis_seedings')
    .dropTable('tennis_head_to_head')
    .dropTable('tennis_matches')
    .dropTable('tennis_standings');
}; 