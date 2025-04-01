/**
 * Seed file for wrestling rivalries
 */
exports.seed = async function(knex) {
  // Delete existing entries
  await knex('wrestling_rivalries').del();
  
  // Get team IDs for creating relationships
  const teams = await knex('wrestling_teams').select('id', 'name');
  
  // Create a lookup for team IDs by name
  const teamIdByName = {};
  teams.forEach(team => {
    teamIdByName[team.name] = team.id;
  });
  
  // Define the notable rivalries with intensity ratings (1-10)
  const rivalries = [
    // Classic rivalries
    { teamA: 'Oklahoma State', teamB: 'Iowa State', intensity: 10, 
      description: 'One of the most storied rivalries in college wrestling history' },
    { teamA: 'Oklahoma', teamB: 'Oklahoma State', intensity: 9, 
      description: 'The Bedlam Series - in-state rivalry with deep historical roots' },
    { teamA: 'Iowa State', teamB: 'Northern Iowa', intensity: 8, 
      description: 'In-state rivalry between two Iowa wrestling powerhouses' },
    { teamA: 'Oklahoma State', teamB: 'Missouri', intensity: 7, 
      description: 'Long-standing regional rivalry with championship implications' },
    
    // Geographic/Regional rivalries
    { teamA: 'Northern Colorado', teamB: 'Wyoming', intensity: 6, 
      description: 'Border rivalry between neighboring states' },
    { teamA: 'South Dakota State', teamB: 'North Dakota State', intensity: 7, 
      description: 'Dakota Marker rivalry extends to wrestling' },
    { teamA: 'Utah Valley', teamB: 'Arizona State', intensity: 5, 
      description: 'Southwestern regional rivalry' },
    
    // Emerging rivalries
    { teamA: 'West Virginia', teamB: 'Oklahoma', intensity: 5, 
      description: 'Big 12 conference rivalry that has intensified in recent years' },
    { teamA: 'Air Force', teamB: 'Wyoming', intensity: 6, 
      description: 'Military vs. Cowboy culture clash' },
    { teamA: 'Missouri', teamB: 'Northern Iowa', intensity: 6, 
      description: 'Competitive series with several close matches' },
    
    // Additional rivalries with lower intensity
    { teamA: 'California Baptist', teamB: 'Utah Valley', intensity: 4, 
      description: 'Developing rivalry between newer conference members' },
    { teamA: 'Arizona State', teamB: 'Oklahoma State', intensity: 7, 
      description: 'Clash between traditional and rising power' }
  ];
  
  // Map the rivalries to use team IDs instead of names
  const rivalriesToInsert = rivalries.map(rivalry => {
    return {
      team_a_id: teamIdByName[rivalry.teamA],
      team_b_id: teamIdByName[rivalry.teamB],
      intensity: rivalry.intensity,
      description: rivalry.description,
      created_at: new Date(),
      updated_at: new Date()
    };
  });
  
  // Only insert rivalries where both teams were found
  const validRivalries = rivalriesToInsert.filter(rivalry => 
    rivalry.team_a_id && rivalry.team_b_id);
  
  if (validRivalries.length > 0) {
    await knex('wrestling_rivalries').insert(validRivalries);
  }
}; 