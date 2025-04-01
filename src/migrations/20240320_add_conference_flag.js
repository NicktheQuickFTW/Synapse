exports.up = function(knex) {
    return knex.schema.alterTable('matches', function(table) {
        table.boolean('is_conference').defaultTo(false);
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('matches', function(table) {
        table.dropColumn('is_conference');
    });
}; 