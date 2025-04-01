exports.up = function(knex) {
    return knex.schema.renameTable('school_rss_feeds', 'school_html_schedules');
};

exports.down = function(knex) {
    return knex.schema.renameTable('school_html_schedules', 'school_rss_feeds');
}; 