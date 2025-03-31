const knex = require('./knex');
const { standings, matches, headToHead } = require('../tiebreakers/tennis/tennis_tiebreaker');

async function initializeTennisData() {
  try {
    // Clear existing data
    await knex('tennis_standings').del();
    await knex('tennis_matches').del();
    await knex('tennis_head_to_head').del();
    await knex('tennis_seedings').del();

    // Insert standings
    for (const team of standings) {
      await knex('tennis_standings').insert({
        team_name: team.team,
        wins: team.wins,
        losses: team.losses,
        win_pct: team.winPct,
        ita_rank: team.itaRank
      });
    }

    // Insert matches
    for (const match of matches) {
      await knex('tennis_matches').insert({
        home_team: match.homeTeam,
        away_team: match.awayTeam,
        match_date: match.date,
        location: match.location,
        winner: match.winner || null
      });
    }

    // Insert head-to-head results
    for (const h2h of headToHead) {
      await knex('tennis_head_to_head').insert({
        team1: h2h.team1,
        team2: h2h.team2,
        winner: h2h.winner
      });
    }

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