exports.up = function(knex) {
    return knex.schema
        .alterTable('matches', table => {
            table.string('sport').notNullable();
            table.unique(['home_team', 'away_team', 'match_date', 'sport']);
        })
        .alterTable('standings', table => {
            table.string('sport').notNullable();
            table.unique(['team_name', 'sport']);
        })
        .alterTable('head_to_head', table => {
            table.string('sport').notNullable();
            table.unique(['team1', 'team2', 'sport']);
        });
};

exports.down = function(knex) {
    return knex.schema
        .alterTable('matches', table => {
            table.dropColumn('sport');
            table.dropUnique(['home_team', 'away_team', 'match_date', 'sport']);
        })
        .alterTable('standings', table => {
            table.dropColumn('sport');
            table.dropUnique(['team_name', 'sport']);
        })
        .alterTable('head_to_head', table => {
            table.dropColumn('sport');
            table.dropUnique(['team1', 'team2', 'sport']);
        });
}; 