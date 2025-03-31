const knex = require('../knex');

const additionalMatches = [
  { home_team: "UCF", away_team: "Texas Tech", match_date: "2025-04-15", location: "Home" },
  { home_team: "Oklahoma State", away_team: "Baylor", match_date: "2025-04-15", location: "Away" },
  { home_team: "Kansas", away_team: "Arizona State", match_date: "2025-04-17", location: "Home" },
  { home_team: "BYU", away_team: "Iowa State", match_date: "2025-04-17", location: "Away" },
  { home_team: "TCU", away_team: "West Virginia", match_date: "2025-04-19", location: "Home" },
  { home_team: "Cincinnati", away_team: "Colorado", match_date: "2025-04-19", location: "Away" },
  { home_team: "Arizona", away_team: "Houston", match_date: "2025-04-20", location: "Home" },
  { home_team: "Utah", away_team: "Kansas State", match_date: "2025-04-20", location: "Away" }
];

const additionalHeadToHead = [
  { team1: "UCF", team2: "BYU", winner: "UCF" },
  { team1: "Texas Tech", team2: "Baylor", winner: "Texas Tech" },
  { team1: "Oklahoma State", team2: "TCU", winner: "Oklahoma State" },
  { team1: "Arizona", team2: "Kansas", winner: "Arizona" },
  { team1: "Kansas State", team2: "Iowa State", winner: "Kansas State" },
  { team1: "Utah", team2: "Colorado", winner: "Utah" },
  { team1: "Cincinnati", team2: "West Virginia", winner: "Cincinnati" },
  { team1: "Houston", team2: "Iowa State", winner: "Iowa State" }
];

const standingsUpdates = [
  { team_name: "UCF", wins: 10, losses: 1 },
  { team_name: "Texas Tech", wins: 9, losses: 1 },
  { team_name: "Oklahoma State", wins: 9, losses: 1 },
  { team_name: "Arizona", wins: 7, losses: 3 },
  { team_name: "Kansas State", wins: 5, losses: 3 },
  { team_name: "Iowa State", wins: 5, losses: 6 },
  { team_name: "Utah", wins: 3, losses: 7 },
  { team_name: "Cincinnati", wins: 2, losses: 9 }
];

async function addTennisData() {
  try {
    // Insert additional matches
    await knex('tennis_matches').insert(additionalMatches);
    console.log('Added new matches');

    // Insert additional head-to-head results
    await knex('tennis_head_to_head').insert(additionalHeadToHead);
    console.log('Added new head-to-head results');

    // Update standings
    for (const update of standingsUpdates) {
      await knex('tennis_standings')
        .where('team_name', update.team_name)
        .update({
          wins: update.wins,
          losses: update.losses,
          win_pct: Number((update.wins / (update.wins + update.losses)).toFixed(3))
        });
    }
    console.log('Updated standings');

    console.log('Successfully added new tennis data');
  } catch (error) {
    console.error('Error adding tennis data:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  addTennisData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { addTennisData }; 