const axios = require('axios');
const cheerio = require('cheerio');
const knex = require('../db/knex');
const { getCurrentStandings, getRemainingMatches, getHeadToHead } = require('../tiebreakers/tennis/tennis_tiebreaker');
const { scheduleIds } = require('../config/big12_womens_tennis');

// Function to fetch team schedule from Big 12 website
async function fetchTeamSchedule(scheduleId) {
  try {
    const response = await axios.get(`https://big12sports.com/schedule.aspx?schedule=${scheduleId}`);
    const $ = cheerio.load(response.data);
    const games = [];

    // Find the schedule table with the correct class
    $('table.sidearm-table.sidearm-schedule-table').find('tr').not('.sidearm-table-header').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 5) { // We expect 5 columns: Date, Opponent, *, Location, Result
        const date = $(cells[0]).text().trim();
        const opponent = $(cells[1]).text().trim();
        const isConf = $(cells[2]).text().trim() === '*';
        const location = $(cells[3]).text().trim();
        const result = $(cells[4]).text().trim();

        // Clean up opponent and location data
        const cleanOpponent = opponent.replace(/^vs\.?\s*/, '').replace(/^at\s*/, '').replace(/\*$/, '').trim();
        const cleanLocation = location.replace(/^vs\.?\s*/, '').replace(/^at\s*/, '').trim();

        // Parse result to determine win/loss
        let parsedResult = null;
        if (result.toLowerCase().startsWith('w')) {
          parsedResult = 'W';
        } else if (result.toLowerCase().startsWith('l')) {
          parsedResult = 'L';
        }

        // Only add completed games that aren't cancelled or postponed
        if (parsedResult && !result.toLowerCase().includes('cancel') && !result.toLowerCase().includes('postpone')) {
          games.push({
            date,
            opponent: cleanOpponent,
            location: cleanLocation,
            result: parsedResult,
            isConference: isConf
          });
        }
      }
    });

    return games;
  } catch (error) {
    console.error(`Error fetching schedule for schedule ID ${scheduleId}:`, error.message);
    return [];
  }
}

// Function to process schedule and calculate statistics
function processSchedule(games) {
  let wins = 0;
  let losses = 0;
  let confWins = 0;
  let confLosses = 0;
  let currentStreak = 0;

  games.forEach(game => {
    if (game.result === 'W') {
      wins++;
      currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
      if (game.isConference) {
        confWins++;
      }
    } else if (game.result === 'L') {
      losses++;
      currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
      if (game.isConference) {
        confLosses++;
      }
    }
  });

  return {
    wins,
    losses,
    confWins,
    confLosses,
    currentStreak
  };
}

// Main function to fetch and process all team schedules
async function main() {
  console.log('\n=== Starting Big 12 Women\'s Tennis Schedule Fetcher ===\n');

  try {
    const teams = Object.keys(scheduleIds);
    console.log(`Found ${teams.length} teams`);
    
    // Fetch schedules for each team
    const teamData = {};
    for (const team of teams) {
      console.log(`Fetching schedule for ${team}...`);
      const schedule = await fetchTeamSchedule(scheduleIds[team]);
      console.log(`Found ${schedule.length} games for ${team}`);
      teamData[team] = schedule;
    }
    
    // Process schedules and calculate statistics
    const stats = {};
    for (const [team, schedule] of Object.entries(teamData)) {
      console.log(`Processing schedule for ${team}...`);
      stats[team] = processSchedule(schedule);
      console.log(`${team}: ${stats[team].wins}-${stats[team].losses} (${stats[team].confWins}-${stats[team].confLosses} conf)`);
    }
    
    // Save to database
    console.log('\nSaving to database...');
    for (const [team, stat] of Object.entries(stats)) {
      try {
        const total = stat.wins + stat.losses;
        const confTotal = stat.confWins + stat.confLosses;
        
        const dataToSave = {
            wins: stat.wins,
            losses: stat.losses,
            conf_wins: stat.confWins,
            conf_losses: stat.confLosses,
            win_percent: total > 0 ? (stat.wins / total) : 0,
            conf_win_percent: confTotal > 0 ? (stat.confWins / confTotal) : 0,
            schedule: JSON.stringify(teamData[team]),
            streak: stat.currentStreak
        };
        
        // First, try to update existing record
        const updated = await knex('tennis_stats')
          .where({ team: team, sport: 'womens-tennis' })
          .update(dataToSave);

        // If no record was updated, insert a new one
        if (updated === 0) {
          await knex('tennis_stats').insert({
            team: team,
            sport: 'womens-tennis',
            ...dataToSave
          });
          console.log(`Inserted ${team} into database`);
        } else {
            console.log(`Updated ${team} in database`);
        }
        
      } catch (error) {
        console.error(`Error saving ${team} to database:`, error);
      }
    }
    
    console.log('\n✅ Successfully saved team statistics to database\n');
    
    // Display current standings
    console.log('\nBig 12 Team Statistics:\n');
    
    // Sort teams by conference win percentage, then overall win percentage
    const sortedTeams = Object.entries(stats)
      .sort(([teamA, statsA], [teamB, statsB]) => {
        const confWinPctA = statsA.confWins / (statsA.confWins + statsA.confLosses) || 0;
        const confWinPctB = statsB.confWins / (statsB.confWins + statsB.confLosses) || 0;
        if (confWinPctA !== confWinPctB) return confWinPctB - confWinPctA;
        
        const overallWinPctA = statsA.wins / (statsA.wins + statsA.losses);
        const overallWinPctB = statsB.wins / (statsB.wins + statsB.losses);
        return overallWinPctB - overallWinPctA;
      });

    sortedTeams.forEach(([team, stat]) => {
      const confTotal = stat.confWins + stat.confLosses;
      const total = stat.wins + stat.losses;
      console.log(`${team}:`);
      console.log(`Overall: ${stat.wins}-${stat.losses} (${(total > 0 ? (stat.wins / total * 100) : 0).toFixed(1)}%)`);
      console.log(`Conference: ${stat.confWins}-${stat.confLosses} (${(confTotal > 0 ? (stat.confWins / confTotal * 100) : 0).toFixed(1)}%)`);
      console.log(`Current Streak: ${stat.currentStreak > 0 ? `W${stat.currentStreak}` : `L${Math.abs(stat.currentStreak)}`}\n`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await knex.destroy();
  }
}

main(); 