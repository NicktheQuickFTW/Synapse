exports.up = function(knex) {
    return knex.schema.createTable('tennis_stats', function(table) {
        table.increments('id').primary();
        table.string('team').notNullable();
        table.string('sport').notNullable();
        table.integer('wins').defaultTo(0);
        table.integer('losses').defaultTo(0);
        table.integer('conf_wins').defaultTo(0);
        table.integer('conf_losses').defaultTo(0);
        table.float('win_percent').defaultTo(0);
        table.float('conf_win_percent').defaultTo(0);
        table.float('points_for').defaultTo(0);
        table.float('points_against').defaultTo(0);
        table.integer('streak').defaultTo(0);
        table.integer('max_streak').defaultTo(0);
        table.integer('conf_streak').defaultTo(0);
        table.integer('max_conf_streak').defaultTo(0);
        table.integer('conf_rank').defaultTo(0);
        table.jsonb('schedule');
        table.timestamps(true, true);
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('tennis_stats');
}; 