const knex = require('./knex');

const standings = [
  { team_name: "UCF", wins: 9, losses: 1, win_percent: 0.900, ita_rank: 15 },
  { team_name: "Texas Tech", wins: 8, losses: 1, win_percent: 0.889, ita_rank: 18 },
  { team_name: "Oklahoma State", wins: 8, losses: 1, win_percent: 0.889, ita_rank: 22 },
  { team_name: "Baylor", wins: 6, losses: 3, win_percent: 0.667, ita_rank: 25 },
  { team_name: "BYU", wins: 6, losses: 3, win_percent: 0.667, ita_rank: 32 },
  { team_name: "Arizona", wins: 6, losses: 3, win_percent: 0.667, ita_rank: 38 },
  { team_name: "Arizona State", wins: 6, losses: 3, win_percent: 0.667, ita_rank: 42 },
  { team_name: "TCU", wins: 6, losses: 3, win_percent: 0.667, ita_rank: 36 },
  { team_name: "Kansas State", wins: 4, losses: 3, win_percent: 0.571, ita_rank: 58 },
  { team_name: "Kansas", wins: 5, losses: 5, win_percent: 0.500, ita_rank: 48 },
  { team_name: "Iowa State", wins: 4, losses: 6, win_percent: 0.400, ita_rank: 64 },
  { team_name: "Utah", wins: 2, losses: 7, win_percent: 0.222, ita_rank: 72 },
  { team_name: "Colorado", wins: 1, losses: 8, win_percent: 0.111, ita_rank: 78 },
  { team_name: "Cincinnati", wins: 1, losses: 9, win_percent: 0.100, ita_rank: 84 },
  { team_name: "West Virginia", wins: 1, losses: 9, win_percent: 0.100, ita_rank: 92 },
  { team_name: "Houston", wins: 1, losses: 9, win_percent: 0.100, ita_rank: 96 }
];

const matches = [
  { home_team: "UCF", away_team: "Houston", match_date: "2025-04-05", location: "Home" },
  { home_team: "BYU", away_team: "UCF", match_date: "2025-04-10", location: "Home" },
  { home_team: "Utah", away_team: "UCF", match_date: "2025-04-12", location: "Home" },
  { home_team: "Texas Tech", away_team: "Arizona", match_date: "2025-04-03", location: "Home" },
  { home_team: "TCU", away_team: "Texas Tech", match_date: "2025-04-10", location: "Home" },
  { home_team: "Oklahoma State", away_team: "BYU", match_date: "2025-04-05", location: "Home" },
  { home_team: "Kansas State", away_team: "Baylor", match_date: "2025-04-05", location: "Away" },
  { home_team: "Baylor", away_team: "Kansas", match_date: "2025-04-12", location: "Home" },
  { home_team: "Kansas State", away_team: "BYU", match_date: "2025-04-03", location: "Away" },
  { home_team: "Houston", away_team: "BYU", match_date: "2025-04-12", location: "Away" },
  { home_team: "Arizona", away_team: "Utah", match_date: "2025-04-10", location: "Home" },
  { home_team: "Arizona State", away_team: "West Virginia", match_date: "2025-04-05", location: "Home" },
  { home_team: "Oklahoma State", away_team: "Arizona State", match_date: "2025-04-12", location: "Away" },
  { home_team: "Cincinnati", away_team: "TCU", match_date: "2025-04-05", location: "Home" },
  { home_team: "Colorado", away_team: "Kansas State", match_date: "2025-04-10", location: "Home" },
  { home_team: "Houston", away_team: "Kansas State", match_date: "2025-04-12", location: "Home" }
];

const headToHead = [
  { team1: "UCF", team2: "Texas Tech", winner: "UCF" },
  { team1: "UCF", team2: "Oklahoma State", winner: "UCF" },
  { team1: "Texas Tech", team2: "Oklahoma State", winner: "Texas Tech" },
  { team1: "Baylor", team2: "BYU", winner: "Baylor" },
  { team1: "Baylor", team2: "Arizona", winner: "Baylor" },
  { team1: "Baylor", team2: "Arizona State", winner: "Arizona State" },
  { team1: "Baylor", team2: "TCU", winner: "Baylor" },
  { team1: "BYU", team2: "Arizona", winner: "BYU" },
  { team1: "BYU", team2: "Arizona State", winner: "Arizona State" },
  { team1: "BYU", team2: "TCU", winner: "BYU" },
  { team1: "Arizona", team2: "Arizona State", winner: "Arizona" },
  { team1: "Arizona", team2: "TCU", winner: "TCU" },
  { team1: "Arizona State", team2: "TCU", winner: "Arizona State" }
];

async function initializeTennisData() {
  try {
    // Clear existing data
    await knex('tennis_standings').del();
    await knex('tennis_matches').del();
    await knex('tennis_head_to_head').del();
    await knex('tennis_seedings').del();

    // Insert standings
    await knex('tennis_standings').insert(standings);

    // Insert matches
    await knex('tennis_matches').insert(matches);

    // Insert head-to-head results
    await knex('tennis_head_to_head').insert(headToHead);

    console.log('Successfully initialized tennis data');
  } catch (error) {
    console.error('Error initializing tennis data:', error);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeTennisData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { initializeTennisData }; 