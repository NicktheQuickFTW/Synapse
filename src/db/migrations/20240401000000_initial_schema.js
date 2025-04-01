exports.up = function(knex) {
  return knex.schema
    .createTable('tennis_standings', function(table) {
      table.increments('id').primary();
      table.string('team_name').notNullable();
      table.integer('wins').defaultTo(0);
      table.integer('losses').defaultTo(0);
      table.decimal('win_percent', 4, 3).defaultTo(0);
      table.integer('ita_rank');
      table.timestamps(true, true);
    })
    .createTable('tennis_matches', function(table) {
      table.increments('id').primary();
      table.string('home_team').notNullable();
      table.string('away_team').notNullable();
      table.date('match_date');
      table.string('location');
      table.string('winner');
      table.timestamps(true, true);
    })
    .createTable('tennis_head_to_head', function(table) {
      table.increments('id').primary();
      table.string('team1').notNullable();
      table.string('team2').notNullable();
      table.string('winner').notNullable();
      table.timestamps(true, true);
    })
    .createTable('tennis_seedings', function(table) {
      table.increments('id').primary();
      table.integer('seed').notNullable();
      table.string('team').notNullable();
      table.string('record');
      table.decimal('win_percent', 4, 3);
      table.string('tiebreaker');
      table.jsonb('scenario_data');
      table.timestamps(true, true);
    })
    .createTable('tennis_stats', table => {
      table.string('team').primary();
      table.string('sport');
      table.integer('wins').defaultTo(0);
      table.integer('losses').defaultTo(0);
      table.integer('conf_wins').defaultTo(0);
      table.integer('conf_losses').defaultTo(0);
      table.float('win_percent').defaultTo(0);
      table.integer('ita_rank');
      table.string('current_streak').defaultTo('0');
      table.json('schedule');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('tennis_stats')
    .dropTable('tennis_seedings')
    .dropTable('tennis_head_to_head')
    .dropTable('tennis_matches')
    .dropTable('tennis_standings');
}; 