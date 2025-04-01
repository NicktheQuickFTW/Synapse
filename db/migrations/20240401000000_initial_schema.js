exports.up = function(knex) {
    return knex.schema
        .createTableIfNotExists('games', function(table) {
            table.increments('id').primary();
            table.string('school').notNullable();
            table.string('sport').notNullable();
            table.date('date').notNullable();
            table.string('opponent').notNullable();
            table.string('location');
            table.string('result');
            table.string('score');
            table.boolean('is_conference').defaultTo(false);
            table.timestamps(true, true);
        })
        .createTableIfNotExists('school_html_schedules', function(table) {
            table.increments('id').primary();
            table.string('school_name').notNullable();
            table.string('sport').notNullable();
            table.string('feed_url').notNullable();
            table.string('feed_type').defaultTo('html');
            table.boolean('is_active').defaultTo(true);
            table.timestamps(true, true);
        });
};

exports.down = function(knex) {
    return knex.schema
        .dropTableIfExists('games')
        .dropTableIfExists('school_html_schedules');
}; 