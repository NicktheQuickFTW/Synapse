const knex = require('../db/knex');
const {
  getCurrentStandings,
  getRemainingMatches,
  getHeadToHead,
  generateTeamScenarios,
  applyTiebreakers,
  calculateSeedingRanges,
  identifyKeyMatches
} = require('../tiebreakers/tennis/tennis_tiebreaker');

async function main() {
  const sport = process.argv[2] || 'womens-tennis';
  console.log(`\n=== Analyzing Big 12 ${sport} Tiebreaker Scenarios ===\n`);

  try {
    // Get current standings
    const standings = await getCurrentStandings(sport);
    console.log('Current Standings:\n');
    standings.forEach((team, index) => {
      console.log(`${index + 1}. ${team.team}`);
      console.log(`   Record: ${team.wins}-${team.losses} (${((team.win_percent || 0) * 100).toFixed(1)}%)`);
      console.log(`   Conference: ${team.conf_wins}-${team.conf_losses}\n`);
    });

    // Get remaining matches
    const remainingMatches = await getRemainingMatches(sport);
    console.log('\nRemaining Matches:\n');
    Object.entries(remainingMatches).forEach(([team, matches]) => {
      if (matches.length > 0) {
        console.log(`${team}:`);
        matches.forEach(match => {
          console.log(`  ${match.date}: vs ${match.opponent}${match.isConference ? ' *' : ''} (${match.location})`);
        });
        console.log('');
      }
    });

    // Get head-to-head records
    const headToHead = await getHeadToHead(sport);
    console.log('\nHead-to-Head Records:\n');
    Object.entries(headToHead).forEach(([matchup, winner]) => {
      console.log(`${matchup}: ${winner}`);
    });

    // Calculate seeding ranges
    const seedingRanges = await calculateSeedingRanges(standings, remainingMatches, headToHead);
    console.log('\nPotential Seeding Ranges:\n');
    Object.entries(seedingRanges).forEach(([team, range]) => {
      console.log(`${team}:`);
      console.log(`  Current: ${range.currentRecord} (${(range.currentWinPercent * 100).toFixed(1)}%)`);
      console.log(`  Best Case: ${range.bestCase.record} - Seed ${range.bestCase.potentialSeed}`);
      console.log(`  Worst Case: ${range.worstCase.record} - Seed ${range.worstCase.potentialSeed}\n`);
    });

    // Identify key matches
    const keyMatches = await identifyKeyMatches(standings, remainingMatches);
    console.log('\nKey Matches:\n');
    keyMatches.forEach(match => {
      console.log(`${match.date}: ${match.team1} vs ${match.team2}`);
      console.log(`Significance: ${match.significance}`);
      console.log(`Reason: ${match.reason}\n`);
    });

    // Generate scenarios for top teams
    const topTeams = standings.slice(0, 4);
    console.log('\nDetailed Scenarios for Top Teams:\n');
    for (const team of topTeams) {
      const scenarios = generateTeamScenarios(team.team, team, remainingMatches[team.team] || []);
      console.log(`${team.team}:`);
      console.log(`  Current Record: ${scenarios.currentRecord}`);
      console.log(`  Best Possible: ${scenarios.bestPossibleRecord} (${(parseFloat(scenarios.bestPossibleWinPercent) * 100).toFixed(1)}%)`);
      console.log(`  Worst Possible: ${scenarios.worstPossibleRecord} (${(parseFloat(scenarios.worstPossibleWinPercent) * 100).toFixed(1)}%)`);
      console.log('  Remaining Schedule:');
      scenarios.remainingMatches.forEach(match => {
        console.log(`    ${match.date}: vs ${match.opponent}${match.isConference ? ' *' : ''} (${match.location})`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await knex.destroy();
  }
}

main(); 