const knex = require('../../db/knex');

// Get current standings from database
async function getCurrentStandings(sport = 'womens-tennis') {
  const standings = await knex('tennis_stats')
    .select('*')
    .where('sport', sport)
    .orderBy('win_percent', 'desc');
  return standings;
}

// Get remaining matches from database
async function getRemainingMatches(sport = 'womens-tennis') {
  const matches = await knex('tennis_stats')
    .select('*')
    .where('sport', sport)
    .whereNotNull('schedule');
  
  // Convert to the format expected by the analysis functions
  const matchesByTeam = {};
  matches.forEach(team => {
    const schedule = JSON.parse(team.schedule);
    const remainingMatches = schedule.filter(game => !game.result);
    
    if (remainingMatches.length > 0) {
      matchesByTeam[team.team] = remainingMatches.map(match => ({
        opponent: match.opponent,
        date: match.date,
        location: match.location,
        isConference: match.opponent.includes('*')
      }));
    }
  });
  
  return matchesByTeam;
}

// Get head-to-head results from database
async function getHeadToHead(sport = 'womens-tennis') {
  const teams = await knex('tennis_stats')
    .select('team', 'schedule')
    .where('sport', sport)
    .whereNotNull('schedule');
  
  // Convert to the format expected by the analysis functions
  const headToHead = {};
  teams.forEach(team => {
    const schedule = JSON.parse(team.schedule);
    schedule.forEach(game => {
      if (game.result) {
        const key = `${team.team} vs ${game.opponent.replace(' *', '')}`;
        headToHead[key] = game.result === 'W' ? team.team : game.opponent.replace(' *', '');
      }
    });
  });
  
  return headToHead;
}

// Generate all possible remaining match outcomes for a team
function generateTeamScenarios(teamName, team, matches) {
  const matchCount = matches.length;
  
  // Generate all possible win-loss combinations
  const scenarios = [];
  
  // Calculate total number of possible scenarios (2^n where n is the number of matches)
  const totalScenarios = Math.pow(2, matchCount);
  
  // Generate each possible scenario
  for (let i = 0; i < totalScenarios; i++) {
    let wins = team.conf_wins;
    let losses = team.conf_losses;
    const matchResults = [];
    
    // Convert index to binary representation of wins/losses
    for (let j = 0; j < matchCount; j++) {
      // Check if bit j is set in i
      const win = (i & (1 << j)) !== 0;
      
      if (win) {
        wins++;
        matchResults.push({ 
          opponent: matches[j].opponent, 
          result: "Win", 
          date: matches[j].date, 
          location: matches[j].location,
          isConference: matches[j].isConference
        });
      } else {
        losses++;
        matchResults.push({ 
          opponent: matches[j].opponent, 
          result: "Loss", 
          date: matches[j].date, 
          location: matches[j].location,
          isConference: matches[j].isConference
        });
      }
    }
    
    // Calculate win percentages
    const winPercent = wins / (wins + losses);
    
    // Add scenario
    scenarios.push({
      record: `${wins}-${losses}`,
      confRecord: `${wins}-${losses}`,
      winPercent: winPercent.toFixed(3),
      confWinPercent: winPercent.toFixed(3),
      matchResults
    });
  }
  
  // Sort scenarios by win percentage (descending)
  scenarios.sort((a, b) => {
    const winPercentA = parseFloat(a.winPercent);
    const winPercentB = parseFloat(b.winPercent);
    return winPercentB - winPercentA;
  });
  
  return {
    currentRecord: `${team.wins}-${team.losses}`,
    currentWinPercent: team.win_percent.toFixed(3),
    itaRank: team.ita_rank,
    remainingMatches: matches,
    possibleScenarios: scenarios,
    bestPossibleRecord: scenarios[0].record,
    bestPossibleWinPercent: scenarios[0].winPercent,
    worstPossibleRecord: scenarios[scenarios.length - 1].record,
    worstPossibleWinPercent: scenarios[scenarios.length - 1].winPercent
  };
}

// Apply tiebreaker rules to determine seeding
function applyTiebreakers(teams, headToHead) {
  // Group teams by win percentage
  const teamsByWinPercent = {};
  teams.forEach(team => {
    const winPercent = team.win_percent.toFixed(3);
    if (!teamsByWinPercent[winPercent]) {
      teamsByWinPercent[winPercent] = [];
    }
    teamsByWinPercent[winPercent].push(team);
  });
  
  // Final seedings
  const seedings = [];
  
  // Process each win percentage group
  Object.entries(teamsByWinPercent)
    .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])) // Sort by win percentage (descending)
    .forEach(([winPercent, tiedTeams]) => {
      // If only one team at this win percentage, no tiebreaker needed
      if (tiedTeams.length === 1) {
        seedings.push({
          seed: seedings.length + 1,
          team: tiedTeams[0].team,
          record: `${tiedTeams[0].wins}-${tiedTeams[0].losses}`,
          winPercent: parseFloat(winPercent),
          tiebreaker: "None needed"
        });
        return;
      }
      
      // If two teams tied
      if (tiedTeams.length === 2) {
        // Check head-to-head
        const team1 = tiedTeams[0].team;
        const team2 = tiedTeams[1].team;
        
        const h2hKey1 = `${team1} vs ${team2}`;
        const h2hKey2 = `${team2} vs ${team1}`;
        
        let winner = null;
        if (headToHead[h2hKey1]) {
          winner = headToHead[h2hKey1];
        } else if (headToHead[h2hKey2]) {
          winner = headToHead[h2hKey2];
        }
        
        if (winner) {
          // Found head-to-head winner
          const winnerTeam = tiedTeams.find(t => t.team === winner);
          const loserTeam = tiedTeams.find(t => t.team !== winner);
          
          seedings.push({
            seed: seedings.length + 1,
            team: winnerTeam.team,
            record: `${winnerTeam.wins}-${winnerTeam.losses}`,
            winPercent: parseFloat(winPercent),
            tiebreaker: `Head-to-head vs ${loserTeam.team}`
          });
          
          seedings.push({
            seed: seedings.length + 1,
            team: loserTeam.team,
            record: `${loserTeam.wins}-${loserTeam.losses}`,
            winPercent: parseFloat(winPercent),
            tiebreaker: `Lost head-to-head vs ${winnerTeam.team}`
          });
        } else {
          // No head-to-head, use ITA rankings
          tiedTeams.sort((a, b) => a.ita_rank - b.ita_rank);
          
          seedings.push({
            seed: seedings.length + 1,
            team: tiedTeams[0].team,
            record: `${tiedTeams[0].wins}-${tiedTeams[0].losses}`,
            winPercent: parseFloat(winPercent),
            tiebreaker: `ITA ranking (#${tiedTeams[0].ita_rank} vs #${tiedTeams[1].ita_rank})`
          });
          
          seedings.push({
            seed: seedings.length + 1,
            team: tiedTeams[1].team,
            record: `${tiedTeams[1].wins}-${tiedTeams[1].losses}`,
            winPercent: parseFloat(winPercent),
            tiebreaker: `Lower ITA ranking (#${tiedTeams[1].ita_rank} vs #${tiedTeams[0].ita_rank})`
          });
        }
      }
      
      // If more than two teams tied (mini round-robin)
      if (tiedTeams.length > 2) {
        // Calculate mini round-robin records
        const miniRecords = {};
        
        // Initialize records
        tiedTeams.forEach(team => {
          miniRecords[team.team] = { wins: 0, losses: 0, winPercent: 0 };
        });
        
        // Calculate wins and losses in games against each other
        tiedTeams.forEach(team1 => {
          tiedTeams.forEach(team2 => {
            if (team1.team !== team2.team) {
              const h2hKey1 = `${team1.team} vs ${team2.team}`;
              const h2hKey2 = `${team2.team} vs ${team1.team}`;
              
              if (headToHead[h2hKey1]) {
                if (headToHead[h2hKey1] === team1.team) {
                  miniRecords[team1.team].wins++;
                  miniRecords[team2.team].losses++;
                } else {
                  miniRecords[team1.team].losses++;
                  miniRecords[team2.team].wins++;
                }
              } else if (headToHead[h2hKey2]) {
                if (headToHead[h2hKey2] === team1.team) {
                  miniRecords[team1.team].wins++;
                  miniRecords[team2.team].losses++;
                } else {
                  miniRecords[team1.team].losses++;
                  miniRecords[team2.team].wins++;
                }
              }
            }
          });
        });
        
        // Calculate win percentages
        Object.keys(miniRecords).forEach(team => {
          const record = miniRecords[team];
          const total = record.wins + record.losses;
          record.winPercent = total > 0 ? record.wins / total : 0;
          record.winPercentStr = record.winPercent.toFixed(3);
        });
        
        // Sort teams by mini round-robin record
        const sortedTeams = [...tiedTeams].sort((a, b) => {
          const recordA = miniRecords[a.team];
          const recordB = miniRecords[b.team];
          
          // First by win percentage
          if (recordB.winPercent !== recordA.winPercent) {
            return recordB.winPercent - recordA.winPercent;
          }
          
          // Then by ITA ranking
          return a.ita_rank - b.ita_rank;
        });
        
        // Add to seedings with explanation
        sortedTeams.forEach(team => {
          const record = miniRecords[team.team];
          seedings.push({
            seed: seedings.length + 1,
            team: team.team,
            record: `${team.wins}-${team.losses}`,
            winPercent: parseFloat(winPercent),
            tiebreaker: `Mini round-robin: ${record.wins}-${record.losses} (${(record.winPercent * 100).toFixed(1)}%)`,
            miniRoundRobinRecord: `${record.wins}-${record.losses}`,
            miniRoundRobinPercent: record.winPercent
          });
        });
      }
    });
  
  return seedings;
}

// Calculate potential seeding ranges for each team
function calculateSeedingRanges(teams, remainingMatches, headToHead) {
  const ranges = {};
  
  // For each team
  teams.forEach(team => {
    const matchCount = remainingMatches[team.team]?.length || 0;
    
    // Best case: win all remaining
    const bestWins = team.wins + matchCount;
    const bestLosses = team.losses;
    const bestWinPercent = bestWins / (bestWins + bestLosses);
    
    // Worst case: lose all remaining
    const worstWins = team.wins;
    const worstLosses = team.losses + matchCount;
    const worstWinPercent = worstWins / (worstWins + worstLosses);
    
    // Estimate best possible seed
    let bestPossibleSeed = 1;
    teams.forEach(opponent => {
      if (opponent.team !== team.team) {
        // Worst case for opponent
        const opponentWorstWins = opponent.wins;
        const opponentWorstLosses = opponent.losses + (remainingMatches[opponent.team]?.length || 0);
        const opponentWorstWinPercent = opponentWorstWins / (opponentWorstWins + opponentWorstLosses);
        
        if (opponentWorstWinPercent > bestWinPercent) {
          bestPossibleSeed++;
        } else if (Math.abs(opponentWorstWinPercent - bestWinPercent) < 0.001) {
          // Check head-to-head if potential tie
          const h2hKey1 = `${team.team} vs ${opponent.team}`;
          const h2hKey2 = `${opponent.team} vs ${team.team}`;
          
          if ((headToHead[h2hKey1] && headToHead[h2hKey1] !== team.team) || 
              (headToHead[h2hKey2] && headToHead[h2hKey2] === opponent.team)) {
            bestPossibleSeed++;
          } else if (!headToHead[h2hKey1] && !headToHead[h2hKey2]) {
            // If no head-to-head, use ITA rankings
            if (opponent.ita_rank < team.ita_rank) {
              bestPossibleSeed++;
            }
          }
        }
      }
    });
    
    // Estimate worst possible seed
    let worstPossibleSeed = 1;
    teams.forEach(opponent => {
      if (opponent.team !== team.team) {
        // Best case for opponent
        const opponentBestWins = opponent.wins + (remainingMatches[opponent.team]?.length || 0);
        const opponentBestLosses = opponent.losses;
        const opponentBestWinPercent = opponentBestWins / (opponentBestWins + opponentBestLosses);
        
        if (opponentBestWinPercent >= worstWinPercent) {
          worstPossibleSeed++;
        } else if (Math.abs(opponentBestWinPercent - worstWinPercent) < 0.001) {
          // If tie, use head-to-head or ITA rankings
          const h2hKey1 = `${team.team} vs ${opponent.team}`;
          const h2hKey2 = `${opponent.team} vs ${team.team}`;
          
          if ((headToHead[h2hKey1] && headToHead[h2hKey1] !== team.team) || 
              (headToHead[h2hKey2] && headToHead[h2hKey2] === opponent.team)) {
            worstPossibleSeed++;
          } else if (!headToHead[h2hKey1] && !headToHead[h2hKey2]) {
            // If no head-to-head, use ITA rankings
            if (opponent.ita_rank < team.ita_rank) {
              worstPossibleSeed++;
            }
          }
        }
      }
    });
    
    // Save the range
    ranges[team.team] = {
      currentRecord: `${team.wins}-${team.losses}`,
      currentWinPercent: team.win_percent,
      bestCase: {
        record: `${bestWins}-${bestLosses}`,
        winPercent: bestWinPercent,
        potentialSeed: bestPossibleSeed
      },
      worstCase: {
        record: `${worstWins}-${worstLosses}`,
        winPercent: worstWinPercent,
        potentialSeed: worstPossibleSeed
      }
    };
  });
  
  return ranges;
}

// Identify key matches that will significantly impact seeding
function identifyKeyMatches(teams, remainingMatches) {
  const keyMatches = [];
  
  // Check each remaining match
  Object.entries(remainingMatches).forEach(([teamName, matches]) => {
    matches.forEach(match => {
      const team1 = teams.find(t => t.team === teamName);
      const team2 = teams.find(t => t.team === match.opponent);
      
      // Determine significance
      let significance = "Low";
      let reason = "";
      
      // Top teams playing each other
      if (team1.win_percent >= 0.800 && team2.win_percent >= 0.800) {
        significance = "Very High";
        reason = "Match between top seeds with direct impact on #1-#3 seeding";
      }
      // Top team vs middle tier
      else if ((team1.win_percent >= 0.800 && Math.abs(team2.win_percent - 0.667) < 0.001) ||
               (team2.win_percent >= 0.800 && Math.abs(team1.win_percent - 0.667) < 0.001)) {
        significance = "High";
        reason = "Match between top seed and middle tier team with potential for upset";
      }
      // Teams with identical records
      else if (Math.abs(team1.win_percent - team2.win_percent) < 0.001) {
        significance = "High";
        reason = "Direct tiebreaker between teams with identical records";
      }
      // Teams close in standings
      else if (Math.abs(team1.win_percent - team2.win_percent) <= 0.1) {
        significance = "Medium";
        reason = "Teams close in standings, outcome affects multiple seed positions";
      }
      
      keyMatches.push({
        matchup: `${teamName} vs ${match.opponent}`,
        date: match.date,
        location: match.location,
        team1Record: `${team1.wins}-${team1.losses}`,
        team2Record: `${team2.wins}-${team2.losses}`,
        significance,
        reason
      });
    });
  });
  
  // Sort by significance
  const significanceOrder = { "Very High": 0, "High": 1, "Medium": 2, "Low": 3 };
  keyMatches.sort((a, b) => {
    if (significanceOrder[a.significance] !== significanceOrder[b.significance]) {
      return significanceOrder[a.significance] - significanceOrder[b.significance];
    }
    return a.date.localeCompare(b.date);
  });
  
  return keyMatches;
}

// Generate comprehensive analysis
async function generateComprehensiveAnalysis() {
  // Get data from database
  const currentStandings = await getCurrentStandings();
  const remainingMatches = await getRemainingMatches();
  const headToHead = await getHeadToHead();
  
  // Generate analysis
  const currentSeedings = applyTiebreakers(currentStandings, headToHead);
  const seedingRanges = calculateSeedingRanges(currentStandings, remainingMatches, headToHead);
  const keyMatches = identifyKeyMatches(currentStandings, remainingMatches);
  
  // Generate scenarios for key teams
  const teamScenarios = {
    UCF: generateTeamScenarios("UCF", 
      currentStandings.find(t => t.team === "UCF"),
      remainingMatches["UCF"] || []
    ),
    BYU: generateTeamScenarios("BYU",
      currentStandings.find(t => t.team === "BYU"),
      remainingMatches["BYU"] || []
    ),
    TexasTech: generateTeamScenarios("Texas Tech",
      currentStandings.find(t => t.team === "Texas Tech"),
      remainingMatches["Texas Tech"] || []
    ),
    OklahomaState: generateTeamScenarios("Oklahoma State",
      currentStandings.find(t => t.team === "Oklahoma State"),
      remainingMatches["Oklahoma State"] || []
    )
  };
  
  return {
    currentStandings,
    remainingMatches,
    headToHead,
    currentSeedings,
    seedingRanges,
    keyMatches,
    teamScenarios
  };
}

module.exports = {
  generateComprehensiveAnalysis,
  generateTeamScenarios,
  applyTiebreakers,
  calculateSeedingRanges,
  identifyKeyMatches,
  getCurrentStandings,
  getRemainingMatches,
  getHeadToHead
}; 