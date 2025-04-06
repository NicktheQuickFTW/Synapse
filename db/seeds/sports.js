/**
 * Seed file for sports data
 */
exports.seed = async function(knex) {
  // First, clean up existing entries
  await knex('sports').del();

  // Then insert the sports
  return knex('sports').insert([
    {
      name: 'Basketball',
      code: 'MBB',
      season: 'winter',
      is_active: true,
      metadata: {
        description: 'Men\'s Basketball',
        season_start: 'November',
        season_end: 'March'
      }
    },
    {
      name: 'Football',
      code: 'FB',
      season: 'fall',
      is_active: true,
      metadata: {
        description: 'College Football',
        season_start: 'August',
        season_end: 'December'
      }
    }
  ]);
}; 