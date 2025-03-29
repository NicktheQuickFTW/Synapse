/**
 * Seed file for agent_registry table
 */
exports.seed = async function(knex) {
  // First get sport IDs from sport_metadata table
  const sports = await knex('sport_metadata').select('sport_id', 'sport_name');
  
  // Create a map of sport names to IDs
  const sportIdMap = {};
  sports.forEach(sport => {
    sportIdMap[sport.sport_name] = sport.sport_id;
  });
  
  // Delete existing entries
  await knex('agent_registry').del();
  
  // Insert seed entries
  await knex('agent_registry').insert([
    {
      agent_id: '123e4567-e89b-12d3-a456-426614174000',
      sport_id: sportIdMap['basketball'],
      last_ping: new Date(),
      capabilities: JSON.stringify({
        clustering: true,
        scheduling: true,
        optimization: true,
        analysis: true
      }),
      agent_type: 'scheduling',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      agent_id: '223e4567-e89b-12d3-a456-426614174001',
      sport_id: sportIdMap['basketball'],
      last_ping: new Date(),
      capabilities: JSON.stringify({
        clustering: false,
        scheduling: false,
        optimization: false,
        analysis: true,
        reporting: true
      }),
      agent_type: 'analysis',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      agent_id: '323e4567-e89b-12d3-a456-426614174002',
      sport_id: sportIdMap['football'],
      last_ping: new Date(),
      capabilities: JSON.stringify({
        clustering: true,
        scheduling: true,
        optimization: true,
        analysis: true
      }),
      agent_type: 'scheduling',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}; 