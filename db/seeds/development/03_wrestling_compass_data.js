/**
 * Seed file for wrestling COMPASS analytics data
 */
exports.seed = async function(knex) {
  // Delete existing entries
  await knex('wrestling_compass_data').del();
  
  // Get team IDs
  const teams = await knex('wrestling_teams').select('id', 'name');
  
  // Initial COMPASS data for each team
  const compassData = [
    {
      teamName: 'Oklahoma State',
      performance: 9.2,  // On-mat performance 
      roster: 8.9,       // Roster dynamics
      infrastructure: 9.0, // Facilities and support
      prestige: 9.8,     // Program history and reputation
      academics: 8.1,    // Academic performance
      analysis: 'Historic powerhouse with the most NCAA team titles in history. Exceptional facilities and continued excellence on the mat.'
    },
    {
      teamName: 'Iowa State',
      performance: 8.7,
      roster: 8.5,
      infrastructure: 8.8,
      prestige: 9.2,
      academics: 8.4,
      analysis: 'Traditional wrestling power with strong recruiting and development. Solid academic performance and excellent facilities.'
    },
    {
      teamName: 'Missouri',
      performance: 8.6,
      roster: 8.4,
      infrastructure: 8.6,
      prestige: 8.3,
      academics: 8.2,
      analysis: 'Consistently strong program with excellent coaching staff and recent championship contention.'
    },
    {
      teamName: 'Arizona State',
      performance: 8.5,
      roster: 8.3,
      infrastructure: 8.2,
      prestige: 7.9,
      academics: 8.0,
      analysis: 'Rising power in collegiate wrestling with significant recent investments in facilities and coaching.'
    },
    {
      teamName: 'Northern Iowa',
      performance: 8.1,
      roster: 7.9,
      infrastructure: 7.8,
      prestige: 8.0,
      academics: 8.3,
      analysis: 'Strong regional program with excellent development of talent and consistent national qualifiers.'
    },
    {
      teamName: 'Oklahoma',
      performance: 7.9,
      roster: 7.8,
      infrastructure: 8.5,
      prestige: 8.7,
      academics: 8.2,
      analysis: 'Historic program with strong traditions and excellent athletic facilities across all sports.'
    },
    {
      teamName: 'Wyoming',
      performance: 7.6,
      roster: 7.5,
      infrastructure: 7.8,
      prestige: 7.4,
      academics: 7.9,
      analysis: 'Competitive program with strong regional recruiting and developing national presence.'
    },
    {
      teamName: 'South Dakota State',
      performance: 7.5,
      roster: 7.3,
      infrastructure: 7.6,
      prestige: 7.2,
      academics: 8.1,
      analysis: 'Growing program with improved recruiting and investment in wrestling facilities.'
    },
    {
      teamName: 'West Virginia',
      performance: 7.4,
      roster: 7.2,
      infrastructure: 8.0,
      prestige: 7.3,
      academics: 7.8,
      analysis: 'Program with potential for growth, benefiting from Big 12 conference membership.'
    },
    {
      teamName: 'North Dakota State',
      performance: 7.3,
      roster: 7.4,
      infrastructure: 7.5,
      prestige: 7.3,
      academics: 8.0,
      analysis: 'Strong regional program with excellent development pipeline and solid academic support.'
    },
    {
      teamName: 'Air Force',
      performance: 7.2,
      roster: 7.0,
      infrastructure: 8.1,
      prestige: 7.5,
      academics: 9.2,
      analysis: 'Unique program with high academic standards and disciplined approach. Excellent facilities.'
    },
    {
      teamName: 'Northern Colorado',
      performance: 6.9,
      roster: 6.8,
      infrastructure: 7.1,
      prestige: 6.7,
      academics: 7.7,
      analysis: 'Program with potential for growth, focused on regional recruitment and development.'
    },
    {
      teamName: 'Utah Valley',
      performance: 6.8,
      roster: 6.7,
      infrastructure: 7.0,
      prestige: 6.5,
      academics: 7.6,
      analysis: 'Newer program showing growth potential with increased investment in wrestling.'
    },
    {
      teamName: 'California Baptist',
      performance: 6.5,
      roster: 6.3,
      infrastructure: 6.8,
      prestige: 6.0,
      academics: 7.8,
      analysis: 'Developing program with focus on West Coast recruiting and building tradition.'
    }
  ];
  
  // Map team names to IDs and calculate composite scores
  const recordsToInsert = [];
  
  compassData.forEach(record => {
    const team = teams.find(t => t.name === record.teamName);
    if (team) {
      // Calculate composite score (weighted average)
      const composite = (
        (record.performance * 0.25) +
        (record.roster * 0.2) +
        (record.infrastructure * 0.2) +
        (record.prestige * 0.2) +
        (record.academics * 0.15)
      ).toFixed(1);
      
      // Create the detailed metrics object
      const detailedMetrics = {
        recruiting_class: (record.roster * 0.8 + Math.random() * 0.4).toFixed(1),
        returning_starters: Math.floor(Math.random() * 5) + 5,
        all_americans: Math.floor(record.performance / 1.5),
        conference_champions_last_year: Math.floor(record.performance / 2),
        coaching_stability: (record.infrastructure * 0.7 + Math.random() * 0.6).toFixed(1),
        fan_support: (record.prestige * 0.8 + Math.random() * 0.4).toFixed(1),
        graduation_rate: (record.academics * 10).toFixed(1) + '%',
        facility_rating: (record.infrastructure * 0.9 + Math.random() * 0.2).toFixed(1),
        program_trajectory: ['rising', 'stable', 'established', 'rebuilding'][Math.floor(Math.random() * 4)]
      };
      
      recordsToInsert.push({
        team_id: team.id,
        performance_score: record.performance,
        roster_score: record.roster,
        infrastructure_score: record.infrastructure,
        prestige_score: record.prestige,
        academics_score: record.academics,
        composite_score: composite,
        detailed_metrics: detailedMetrics,
        analysis_summary: record.analysis,
        analysis_date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  });
  
  if (recordsToInsert.length > 0) {
    await knex('wrestling_compass_data').insert(recordsToInsert);
  }
}; 