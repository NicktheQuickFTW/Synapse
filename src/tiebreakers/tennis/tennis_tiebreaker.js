const knex = require('../../../db/knex');

// Get current standings from database
async function getCurrentStandings() {
  const standings = await knex('tennis_standings')
    .select('*')
    .orderBy('win_pct', 'desc');
  return standings;
}

// Get remaining matches from database
async function getRemainingMatches() {
  const matches = await knex('tennis_matches')
    .select('*')
    .whereNull('winner')
    .orderBy('match_date', 'asc');
  
  // Convert to the format expected by the analysis functions
  const matchesByTeam = {};
  matches.forEach(match => {
    if (!matchesByTeam[match.home_team]) {
      matchesByTeam[match.home_team] = [];
    }
    if (!matchesByTeam[match.away_team]) {
      matchesByTeam[match.away_team] = [];
    }
    
    matchesByTeam[match.home_team].push({
      opponent: match.away_team,
      date: match.match_date,
      location: 'Home'
    });
    
    matchesByTeam[match.away_team].push({
      opponent: match.home_team,
      date: match.match_date,
      location: 'Away'
    });
  });
  
  return matchesByTeam;
}

// Get head-to-head results from database
async function getHeadToHead() {
  const results = await knex('tennis_head_to_head')
    .select('*');
  
  // Convert to the format expected by the analysis functions
  const headToHead = {};
  results.forEach(result => {
    headToHead[`${result.team1} vs ${result.team2}`] = result.winner;
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
    let wins = team.wins;
    let losses = team.losses;
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
          location: matches[j].location 
        });
      } else {
        losses++;
        matchResults.push({ 
          opponent: matches[j].opponent, 
          result: "Loss", 
          date: matches[j].date, 
          location: matches[j].location 
        });
      }
    }
    
    // Calculate win percentage
    const winPct = wins / (wins + losses);
    
    // Add scenario
    scenarios.push({
      record: `${wins}-${losses}`,
      winPct: winPct.toFixed(3),
      matchResults
    });
  }
  
  // Sort scenarios by win percentage (descending)
  scenarios.sort((a, b) => {
    const winPctA = parseFloat(a.winPct);
    const winPctB = parseFloat(b.winPct);
    return winPctB - winPctA;
  });
  
  return {
    currentRecord: `${team.wins}-${team.losses}`,
    currentWinPct: team.winPct.toFixed(3),
    itaRank: team.itaRank,
    remainingMatches: matches,
    possibleScenarios: scenarios,
    bestPossibleRecord: scenarios[0].record,
    bestPossibleWinPct: scenarios[0].winPct,
    worstPossibleRecord: scenarios[scenarios.length - 1].record,
    worstPossibleWinPct: scenarios[scenarios.length - 1].winPct
  };
}

// Apply tiebreaker rules to determine seeding
function applyTiebreakers(teams, headToHead) {
  // Group teams by win percentage
  const teamsByWinPct = {};
  teams.forEach(team => {
    const winPct = team.winPct.toFixed(3);
    if (!teamsByWinPct[winPct]) {
      teamsByWinPct[winPct] = [];
    }
    teamsByWinPct[winPct].push(team);
  });
  
  // Final seedings
  const seedings = [];
  
  // Process each win percentage group
  Object.entries(teamsByWinPct)
    .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])) // Sort by win percentage (descending)
    .forEach(([winPct, tiedTeams]) => {
      // If only one team at this win percentage, no tiebreaker needed
      if (tiedTeams.length === 1) {
        seedings.push({
          seed: seedings.length + 1,
          team: tiedTeams[0].name,
          record: `${tiedTeams[0].wins}-${tiedTeams[0].losses}`,
          winPct: parseFloat(winPct),
          tiebreaker: "None needed"
        });
        return;
      }
      
      // If two teams tied
      if (tiedTeams.length === 2) {
        // Check head-to-head
        const team1 = tiedTeams[0].name;
        const team2 = tiedTeams[1].name;
        
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
          const winnerTeam = tiedTeams.find(t => t.name === winner);
          const loserTeam = tiedTeams.find(t => t.name !== winner);
          
          seedings.push({
            seed: seedings.length + 1,
            team: winnerTeam.name,
            record: `${winnerTeam.wins}-${winnerTeam.losses}`,
            winPct: parseFloat(winPct),
            tiebreaker: `Head-to-head vs ${loserTeam.name}`
          });
          
          seedings.push({
            seed: seedings.length + 1,
            team: loserTeam.name,
            record: `${loserTeam.wins}-${loserTeam.losses}`,
            winPct: parseFloat(winPct),
            tiebreaker: `Lost head-to-head vs ${winnerTeam.name}`
          });
        } else {
          // No head-to-head, use ITA rankings
          tiedTeams.sort((a, b) => a.itaRank - b.itaRank);
          
          seedings.push({
            seed: seedings.length + 1,
            team: tiedTeams[0].name,
            record: `${tiedTeams[0].wins}-${tiedTeams[0].losses}`,
            winPct: parseFloat(winPct),
            tiebreaker: `ITA ranking (#${tiedTeams[0].itaRank} vs #${tiedTeams[1].itaRank})`
          });
          
          seedings.push({
            seed: seedings.length + 1,
            team: tiedTeams[1].name,
            record: `${tiedTeams[1].wins}-${tiedTeams[1].losses}`,
            winPct: parseFloat(winPct),
            tiebreaker: `Lower ITA ranking (#${tiedTeams[1].itaRank} vs #${tiedTeams[0].itaRank})`
          });
        }
      }
      
      // If more than two teams tied (mini round-robin)
      if (tiedTeams.length > 2) {
        // Calculate mini round-robin records
        const miniRecords = {};
        
        // Initialize records
        tiedTeams.forEach(team => {
          miniRecords[team.name] = { wins: 0, losses: 0, winPct: 0 };
        });
        
        // Calculate wins and losses in games against each other
        tiedTeams.forEach(team1 => {
          tiedTeams.forEach(team2 => {
            if (team1.name !== team2.name) {
              const h2hKey1 = `${team1.name} vs ${team2.name}`;
              const h2hKey2 = `${team2.name} vs ${team1.name}`;
              
              if (headToHead[h2hKey1]) {
                if (headToHead[h2hKey1] === team1.name) {
                  miniRecords[team1.name].wins++;
                  miniRecords[team2.name].losses++;
                } else {
                  miniRecords[team1.name].losses++;
                  miniRecords[team2.name].wins++;
                }
              } else if (headToHead[h2hKey2]) {
                if (headToHead[h2hKey2] === team1.name) {
                  miniRecords[team1.name].wins++;
                  miniRecords[team2.name].losses++;
                } else {
                  miniRecords[team1.name].losses++;
                  miniRecords[team2.name].wins++;
                }
              }
            }
          });
        });
        
        // Calculate win percentages
        Object.keys(miniRecords).forEach(team => {
          const record = miniRecords[team];
          const total = record.wins + record.losses;
          record.winPct = total > 0 ? record.wins / total : 0;
          record.winPctStr = record.winPct.toFixed(3);
        });
        
        // Sort teams by mini round-robin record
        const sortedTeams = [...tiedTeams].sort((a, b) => {
          const recordA = miniRecords[a.name];
          const recordB = miniRecords[b.name];
          
          // First by win percentage
          if (recordB.winPct !== recordA.winPct) {
            return recordB.winPct - recordA.winPct;
          }
          
          // Then by ITA ranking
          return a.itaRank - b.itaRank;
        });
        
        // Add to seedings with explanation
        sortedTeams.forEach(team => {
          const record = miniRecords[team.name];
          seedings.push({
            seed: seedings.length + 1,
            team: team.name,
            record: `${team.wins}-${team.losses}`,
            winPct: parseFloat(winPct),
            tiebreaker: `Mini round-robin: ${record.wins}-${record.losses} (${(record.winPct * 100).toFixed(1)}%)`,
            miniRoundRobinRecord: `${record.wins}-${record.losses}`,
            miniRoundRobinPct: record.winPct
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
    const matchCount = remainingMatches[team.name]?.length || 0;
    
    // Best case: win all remaining
    const bestWins = team.wins + matchCount;
    const bestLosses = team.losses;
    const bestWinPct = bestWins / (bestWins + bestLosses);
    
    // Worst case: lose all remaining
    const worstWins = team.wins;
    const worstLosses = team.losses + matchCount;
    const worstWinPct = worstWins / (worstWins + worstLosses);
    
    // Estimate best possible seed
    let bestPossibleSeed = 1;
    teams.forEach(opponent => {
      if (opponent.name !== team.name) {
        // Worst case for opponent
        const opponentWorstWins = opponent.wins;
        const opponentWorstLosses = opponent.losses + (remainingMatches[opponent.name]?.length || 0);
        const opponentWorstWinPct = opponentWorstWins / (opponentWorstWins + opponentWorstLosses);
        
        if (opponentWorstWinPct > bestWinPct) {
          bestPossibleSeed++;
        } else if (Math.abs(opponentWorstWinPct - bestWinPct) < 0.001) {
          // Check head-to-head if potential tie
          const h2hKey1 = `${team.name} vs ${opponent.name}`;
          const h2hKey2 = `${opponent.name} vs ${team.name}`;
          
          if ((headToHead[h2hKey1] && headToHead[h2hKey1] !== team.name) || 
              (headToHead[h2hKey2] && headToHead[h2hKey2] === opponent.name)) {
            bestPossibleSeed++;
          } else if (!headToHead[h2hKey1] && !headToHead[h2hKey2]) {
            // If no head-to-head, use ITA rankings
            if (opponent.itaRank < team.itaRank) {
              bestPossibleSeed++;
            }
          }
        }
      }
    });
    
    // Estimate worst possible seed
    let worstPossibleSeed = 1;
    teams.forEach(opponent => {
      if (opponent.name !== team.name) {
        // Best case for opponent
        const opponentBestWins = opponent.wins + (remainingMatches[opponent.name]?.length || 0);
        const opponentBestLosses = opponent.losses;
        const opponentBestWinPct = opponentBestWins / (opponentBestWins + opponentBestLosses);
        
        if (opponentBestWinPct >= worstWinPct) {
          worstPossibleSeed++;
        } else if (Math.abs(opponentBestWinPct - worstWinPct) < 0.001) {
          // If tie, use head-to-head or ITA rankings
          const h2hKey1 = `${team.name} vs ${opponent.name}`;
          const h2hKey2 = `${opponent.name} vs ${team.name}`;
          
          if ((headToHead[h2hKey1] && headToHead[h2hKey1] !== team.name) || 
              (headToHead[h2hKey2] && headToHead[h2hKey2] === opponent.name)) {
            worstPossibleSeed++;
          } else if (!headToHead[h2hKey1] && !headToHead[h2hKey2]) {
            // If no head-to-head, use ITA rankings
            if (opponent.itaRank < team.itaRank) {
              worstPossibleSeed++;
            }
          }
        }
      }
    });
    
    // Save the range
    ranges[team.name] = {
      currentRecord: `${team.wins}-${team.losses}`,
      currentWinPct: team.winPct,
      bestCase: {
        record: `${bestWins}-${bestLosses}`,
        winPct: bestWinPct,
        potentialSeed: bestPossibleSeed
      },
      worstCase: {
        record: `${worstWins}-${worstLosses}`,
        winPct: worstWinPct,
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
      const team1 = teams.find(t => t.name === teamName);
      const team2 = teams.find(t => t.name === match.opponent);
      
      // Determine significance
      let significance = "Low";
      let reason = "";
      
      // Top teams playing each other
      if (team1.winPct >= 0.800 && team2.winPct >= 0.800) {
        significance = "Very High";
        reason = "Match between top seeds with direct impact on #1-#3 seeding";
      }
      // Top team vs middle tier
      else if ((team1.winPct >= 0.800 && Math.abs(team2.winPct - 0.667) < 0.001) ||
               (team2.winPct >= 0.800 && Math.abs(team1.winPct - 0.667) < 0.001)) {
        significance = "High";
        reason = "Match between top seed and middle tier team with potential for upset";
      }
      // Teams with identical records
      else if (Math.abs(team1.winPct - team2.winPct) < 0.001) {
        significance = "High";
        reason = "Direct tiebreaker between teams with identical records";
      }
      // Teams close in standings
      else if (Math.abs(team1.winPct - team2.winPct) <= 0.1) {
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
      currentStandings.find(t => t.name === "UCF"),
      remainingMatches["UCF"] || []
    ),
    BYU: generateTeamScenarios("BYU",
      currentStandings.find(t => t.name === "BYU"),
      remainingMatches["BYU"] || []
    ),
    TexasTech: generateTeamScenarios("Texas Tech",
      currentStandings.find(t => t.name === "Texas Tech"),
      remainingMatches["Texas Tech"] || []
    ),
    OklahomaState: generateTeamScenarios("Oklahoma State",
      currentStandings.find(t => t.name === "Oklahoma State"),
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
  identifyKeyMatches
}; 