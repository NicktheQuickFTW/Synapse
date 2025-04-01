const axios = require('axios');
const cheerio = require('cheerio');
const knex = require('../db/knex');
const { getCurrentStandings, getRemainingMatches, getHeadToHead } = require('../tiebreakers/tennis/tennis_tiebreaker');

// Function to fetch team schedule from Big 12 website
async function fetchTeamSchedule(scheduleId) {
  try {
    const response = await axios.get(`https://big12sports.com/schedule.aspx?schedule=${scheduleId}`);
    const $ = cheerio.load(response.data);
    const games = [];

    // Find the schedule table
    $('.sidearm-table').find('tr').not('.sidearm-table-header').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 4) {
        const date = $(cells[0]).text().trim();
        const opponent = $(cells[1]).text().trim();
        const location = $(cells[2]).text().trim();
        const result = $(cells[3]).text().trim();

        // Clean up opponent and location data
        const cleanOpponent = opponent.replace(/^vs\.?\s*/, '').replace(/^at\s*/, '');
        const cleanLocation = location.replace(/^vs\.?\s*/, '').replace(/^at\s*/, '');

        // Determine if this is a conference match
        const isConference = opponent.includes('*') || opponent.includes('Big 12');

        // Parse result to determine win/loss
        let parsedResult = null;
        if (result.includes('W')) {
          parsedResult = 'W';
        } else if (result.includes('L')) {
          parsedResult = 'L';
        }

        games.push({
          date,
          opponent: cleanOpponent,
          location: cleanLocation,
          result: parsedResult,
          isConference
        });
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
  let pointsFor = 0;
  let pointsAgainst = 0;
  let currentStreak = 0;
  let maxStreak = 0;
  let currentConfStreak = 0;
  let maxConfStreak = 0;

  games.forEach(game => {
    if (game.result === 'W') {
      wins++;
      currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
      maxStreak = Math.max(maxStreak, currentStreak);
      if (game.isConference) {
        confWins++;
        currentConfStreak = currentConfStreak > 0 ? currentConfStreak + 1 : 1;
        maxConfStreak = Math.max(maxConfStreak, currentConfStreak);
      }
    } else if (game.result === 'L') {
      losses++;
      currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
      maxStreak = Math.max(maxStreak, Math.abs(currentStreak));
      if (game.isConference) {
        confLosses++;
        currentConfStreak = currentConfStreak < 0 ? currentConfStreak - 1 : -1;
        maxConfStreak = Math.max(maxConfStreak, Math.abs(currentConfStreak));
      }
    }

    // Only count points for completed games
    if (game.result === 'W' || game.result === 'L') {
      const score = game.result.match(/\d+-\d+/);
      if (score) {
        const [teamScore, oppScore] = score[0].split('-').map(Number);
        pointsFor += teamScore;
        pointsAgainst += oppScore;
      }
    }
  });

  return {
    wins,
    losses,
    confWins,
    confLosses,
    pointsFor,
    pointsAgainst,
    currentStreak,
    maxStreak,
    currentConfStreak,
    maxConfStreak
  };
}

// Main function to fetch and process all team schedules
async function main() {
  console.log('\n=== Starting Big 12 Women\'s Tennis Schedule Fetcher ===\n');

  try {
    // First check if we have data in the database
    const existingData = await knex('tennis_stats')
      .where('sport', 'womens-tennis')
      .first();

    if (existingData) {
      console.log('Found existing data in database. Using stored data...');
      
      // Get current standings
      const standings = await getCurrentStandings('womens-tennis');
      console.log('\nBig 12 Team Statistics:\n');
      
      standings.forEach(team => {
        console.log(`${team.team}:`);
        console.log(`Overall: ${team.wins}-${team.losses} (${(team.win_percent * 100).toFixed(1)}%)`);
        console.log(`Conference: ${team.conf_wins}-${team.conf_losses}`);
        console.log(`Points: ${team.points_for.toFixed(1)} for, ${team.points_against.toFixed(1)} against per game (${(team.points_for - team.points_against).toFixed(1)} differential)`);
        console.log(`Streak: ${team.streak}`);
        console.log(`Conference Rank: ${team.conf_rank}\n`);
      });

      // Get remaining matches
      const remainingMatches = await getRemainingMatches('womens-tennis');
      console.log('\nRemaining Matches:\n');
      
      Object.entries(remainingMatches).forEach(([team, matches]) => {
        console.log(`${team}:`);
        matches.forEach(match => {
          console.log(`${match.date}: ${match.location} - ${match.opponent}${match.isConference ? ' *' : ''}`);
        });
        console.log('');
      });

      return;
    }

    // If no data exists, proceed with fetching new data
    console.log('No existing data found. Fetching new data...');
    
    // Get schedule IDs from config
    const scheduleIds = require('../config/big12_womens_tennis');
    const teams = Object.keys(scheduleIds);
    
    console.log(`Found ${teams.length} teams`);
    
    // Fetch schedules for each team
    const teamData = {};
    for (const team of teams) {
      console.log(`Fetching schedule for ${team}...`);
      const schedule = await fetchTeamSchedule(scheduleIds[team]);
      teamData[team] = schedule;
    }
    
    // Process schedules and calculate statistics
    const stats = {};
    for (const [team, schedule] of Object.entries(teamData)) {
      stats[team] = processSchedule(schedule);
    }
    
    // Save to database
    for (const [team, stat] of Object.entries(stats)) {
      await knex('tennis_stats').insert({
        team: team,
        sport: 'womens-tennis',
        wins: stat.wins,
        losses: stat.losses,
        conf_wins: stat.confWins,
        conf_losses: stat.confLosses,
        win_percent: stat.wins / (stat.wins + stat.losses),
        conf_win_percent: stat.confWins / (stat.confWins + stat.confLosses),
        points_for: stat.pointsFor,
        points_against: stat.pointsAgainst,
        streak: stat.currentStreak,
        max_streak: stat.maxStreak,
        conf_streak: stat.currentConfStreak,
        max_conf_streak: stat.maxConfStreak,
        conf_rank: 1, // This will be updated by the tiebreaker
        schedule: JSON.stringify(schedule)
      });
    }
    
    console.log('\n✅ Successfully saved team statistics to database\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await knex.destroy();
  }
}

main(); 