/**
 * Seed file to set up sport-team relationships
 */
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('sport_teams').del()
    .then(function () {
      // Get all sports and teams
      return Promise.all([
        knex('sports').select('*'),
        knex('teams').select('*')
      ]);
    })
    .then(function ([sports, teams]) {
      // Create sport-team relationships
      const sportTeams = [];
      
      // Helper function to create sport-team relationship
      const createSportTeam = (sport, team, conference = 'Big 12') => {
        return {
          sport_id: sport.id,
          team_id: team.id,
          conference: conference,
          is_active: true,
          season_stats: {
            current_season: new Date().getFullYear(),
            last_updated: new Date().toISOString()
          }
        };
      };

      // Create relationships for each team
      teams.forEach(team => {
        // Special handling for Oklahoma (wrestling only)
        if (team.abbreviation === 'OU') {
          const wrestling = sports.find(s => s.code === 'WR');
          if (wrestling) {
            sportTeams.push(createSportTeam(wrestling, team));
          }
        } else {
          // For all other teams, create relationships for all sports
          sports.forEach(sport => {
            sportTeams.push(createSportTeam(sport, team));
          });
        }
      });

      // Insert all sport-team relationships
      return knex('sport_teams').insert(sportTeams);
    });
}; 