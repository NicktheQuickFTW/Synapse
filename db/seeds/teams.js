/**
 * Seed file for teams data
 */
exports.seed = async function(knex) {
  // First, clean up existing entries
  await knex('teams').del();

  // Get the basketball sport ID
  const [basketball] = await knex('sports')
    .where('code', 'MBB')
    .select('id');

  if (!basketball) {
    throw new Error('Basketball sport not found');
  }

  // Insert the teams
  const teams = await knex('teams').insert([
    {
      name: 'Duke',
      short_name: 'Duke',
      abbreviation: 'DUKE',
      mascot: 'Blue Devils',
      primary_color: '#003087',
      secondary_color: '#FFFFFF',
      location: 'Durham, NC',
      latitude: 36.0016,
      longitude: -78.9382,
      metadata: {
        conference: 'ACC',
        arena: 'Cameron Indoor Stadium',
        capacity: 9314
      }
    },
    {
      name: 'North Carolina',
      short_name: 'UNC',
      abbreviation: 'UNC',
      mascot: 'Tar Heels',
      primary_color: '#7BAFD4',
      secondary_color: '#FFFFFF',
      location: 'Chapel Hill, NC',
      latitude: 35.9042,
      longitude: -79.0469,
      metadata: {
        conference: 'ACC',
        arena: 'Dean E. Smith Center',
        capacity: 21750
      }
    },
    {
      name: 'Kentucky',
      short_name: 'Kentucky',
      abbreviation: 'UK',
      mascot: 'Wildcats',
      primary_color: '#0033A0',
      secondary_color: '#FFFFFF',
      location: 'Lexington, KY',
      latitude: 38.0406,
      longitude: -84.5037,
      metadata: {
        conference: 'SEC',
        arena: 'Rupp Arena',
        capacity: 20320
      }
    },
    {
      name: 'Kansas',
      short_name: 'Kansas',
      abbreviation: 'KU',
      mascot: 'Jayhawks',
      primary_color: '#0051BA',
      secondary_color: '#E8000D',
      location: 'Lawrence, KS',
      latitude: 38.9587,
      longitude: -95.2475,
      metadata: {
        conference: 'Big 12',
        arena: 'Allen Fieldhouse',
        capacity: 16300
      }
    }
  ]).returning('*');

  // Create sport_teams entries
  return knex('sport_teams').insert(
    teams.map(team => ({
      sport_id: basketball.id,
      team_id: team.id,
      conference: team.metadata.conference,
      is_active: true
    }))
  );
}; 