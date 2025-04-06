/**
 * Seed file for transfer portal data
 */
exports.seed = async function(knex) {
  // First, get the sport_id for basketball
  const [basketball] = await knex('sports')
    .where('name', 'Basketball')
    .select('id');

  if (!basketball) {
    throw new Error('Basketball sport not found');
  }

  // Get some team IDs
  const teams = await knex('teams')
    .whereIn('name', ['Duke', 'North Carolina', 'Kentucky', 'Kansas'])
    .select('id', 'name');

  // Create some test players
  const players = await knex('players').insert([
    {
      name: 'John Smith',
      sport_id: basketball.id,
      position: 'Guard',
      height: '6-3',
      weight: '190',
      hometown: 'New York, NY',
      high_school: 'St. John\'s Prep'
    },
    {
      name: 'Mike Johnson',
      sport_id: basketball.id,
      position: 'Forward',
      height: '6-8',
      weight: '220',
      hometown: 'Chicago, IL',
      high_school: 'Simeon Career Academy'
    }
  ]).returning('*');

  // Insert transfer portal entries
  return knex('transfer_portal').insert([
    {
      player_id: players[0].id,
      sport_id: basketball.id,
      status: 'Available',
      entry_date: new Date(),
      previous_team_id: teams.find(t => t.name === 'Duke').id,
      position: 'Guard',
      eligibility: 'Junior',
      class_year: '2024',
      transfer_type: 'Regular Transfer',
      is_graduate_transfer: false,
      years_remaining: 2,
      stats: {
        points_per_game: 15.5,
        rebounds_per_game: 4.2,
        assists_per_game: 3.8,
        field_goal_percentage: 0.425,
        three_point_percentage: 0.382
      }
    },
    {
      player_id: players[1].id,
      sport_id: basketball.id,
      status: 'Committed',
      entry_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      commitment_date: new Date(),
      previous_team_id: teams.find(t => t.name === 'North Carolina').id,
      new_team_id: teams.find(t => t.name === 'Kentucky').id,
      position: 'Forward',
      eligibility: 'Senior',
      class_year: '2024',
      transfer_type: 'Grad Transfer',
      is_graduate_transfer: true,
      years_remaining: 1,
      stats: {
        points_per_game: 18.2,
        rebounds_per_game: 6.5,
        assists_per_game: 2.1,
        field_goal_percentage: 0.485,
        three_point_percentage: 0.352
      }
    }
  ]);
}; 