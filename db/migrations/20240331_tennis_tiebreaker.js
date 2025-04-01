exports.up = function(knex) {
  return knex.schema
    .createTable('school_rss_feeds', function(table) {
      table.increments('id').primary();
      table.string('school_name').notNullable();
      table.string('sport').notNullable();
      table.string('feed_url').notNullable();
      table.string('feed_type').defaultTo('rss'); // 'rss' or 'html'
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      // Indexes
      table.index(['school_name', 'sport']);
      table.index('feed_type');
    })
    .createTable('tennis_standings', function(table) {
      // ... existing code ...
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('school_rss_feeds')
    .dropTable('tennis_standings');
}; 