exports.up = function(knex) {
    return knex.schema.renameTable('matches', 'games');
};

exports.down = function(knex) {
    return knex.schema.renameTable('games', 'matches');
}; 