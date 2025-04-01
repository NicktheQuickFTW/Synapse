const knex = require('../../db/knex');

// Get current standings from database
async function getCurrentStandings(sport = 'womens-tennis') {
  try {
    const standings = await knex('tennis_stats')
      .select('*')
      .where('sport', sport)
      .orderBy('win_percent', 'desc');
    
    if (!standings || standings.length === 0) {
      console.warn(`No standings found for sport: ${sport}`);
      return [];
    }
    
    return standings.map(team => ({
      team: team.team,
      wins: parseInt(team.wins) || 0,
      losses: parseInt(team.losses) || 0,
      conf_wins: parseInt(team.conf_wins) || 0,
      conf_losses: parseInt(team.conf_losses) || 0,
      win_percent: parseFloat(team.win_percent) || 0,
      ita_rank: parseInt(team.ita_rank) || 999, // Default to 999 if no ITA rank
      current_streak: team.current_streak || '0'
    }));
  } catch (error) {
    console.error(`Error fetching standings for ${sport}:`, error);
    return [];
  }
}

// Get remaining matches from database
async function getRemainingMatches(sport = 'womens-tennis') {
  try {
    const matches = await knex('tennis_stats')
      .select('team', 'schedule')
      .where('sport', sport)
      .whereNotNull('schedule');
    
    if (!matches || matches.length === 0) {
      console.warn(`No schedule data found for sport: ${sport}`);
      return {};
    }
    
    // Convert to the format expected by the analysis functions
    const matchesByTeam = {};
    matches.forEach(team => {
      let schedule;
      try {
        schedule = typeof team.schedule === 'string' ? JSON.parse(team.schedule) : team.schedule;
      } catch (error) {
        console.error(`Error parsing schedule for team ${team.team}:`, error);
        schedule = [];
      }
      
      if (!Array.isArray(schedule)) {
        console.warn(`Schedule for ${team.team} is not an array. Type: ${typeof schedule}`);
        return;
      }
      
      // Filter for future matches (no result yet)
      // Also filter to only include conference matches for analysis
      const today = new Date();
      const remainingMatches = schedule.filter(game => {
        // Skip games with results
        if (game.result) return false;
        
        // Check if the game is in the future
        try {
          const gameDate = new Date(game.date);
          return gameDate >= today && game.isConference;
        } catch (e) {
          // If we can't parse the date, assume it's upcoming
          return game.isConference;
        }
      });
      
      if (remainingMatches.length > 0) {
        matchesByTeam[team.team] = remainingMatches.map(match => ({
          opponent: match.opponent,
          date: match.date,
          location: match.location,
          isConference: match.isConference
        }));
      }
    });
    
    return matchesByTeam;
  } catch (error) {
    console.error(`Error fetching remaining matches for ${sport}:`, error);
    return {};
  }
}

// Get head-to-head results from database
async function getHeadToHead(sport = 'womens-tennis') {
  try {
    const teams = await knex('tennis_stats')
      .select('team', 'schedule')
      .where('sport', sport)
      .whereNotNull('schedule');
    
    if (!teams || teams.length === 0) {
      console.warn(`No schedule data found for sport: ${sport}`);
      return {};
    }
    
    const headToHeadWinners = {}; // Renamed from headToHead to avoid confusion
    const matchDetails = {};
    const processedMatchKeys = new Set(); // To track processed matches
    
    teams.forEach(team => {
      let schedule;
      try {
        schedule = typeof team.schedule === 'string' ? JSON.parse(team.schedule) : team.schedule;
      } catch (error) {
        console.error(`Error parsing schedule for team ${team.team}:`, error);
        schedule = [];
      }
      
      if (!Array.isArray(schedule)) {
        console.warn(`Schedule for ${team.team} is not an array. Type: ${typeof schedule}`);
        return;
      }
      
      schedule.forEach(game => {
        if (game.result && game.isConference && game.opponent) {
          // Create a consistent key for the match using sorted team names and date
          const sortedTeams = [team.team, game.opponent].sort();
          const matchKey = `${sortedTeams[0]}|${sortedTeams[1]}|${game.date}`;
          
          // Skip if this match combination (regardless of perspective) has been processed
          if (processedMatchKeys.has(matchKey)) {
            return; 
          }
          processedMatchKeys.add(matchKey);
          
          const h2hKey = `${team.team} vs ${game.opponent}`; // Key from this team's perspective
          const winner = game.result === 'W' ? team.team : game.opponent;
          const loser = game.result === 'W' ? game.opponent : team.team;
          
          headToHeadWinners[h2hKey] = winner;
          
          matchDetails[h2hKey] = {
            date: game.date,
            location: game.location,
            winner,
            loser,
            score: game.score || 'Unknown' 
          };
        }
      });
    });
    
    return { 
      winners: headToHeadWinners, 
      matchDetails 
    };
  } catch (error) {
    console.error(`Error fetching head-to-head data for ${sport}:`, error);
    return { winners: {}, matchDetails: {} };
  }
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
    let confWins = team.conf_wins;
    let confLosses = team.conf_losses;
    const matchResults = [];
    
    // Convert index to binary representation of wins/losses
    for (let j = 0; j < matchCount; j++) {
      // Check if bit j is set in i
      const win = (i & (1 << j)) !== 0;
      const isConference = matches[j].isConference;
      
      if (win) {
        wins++;
        if (isConference) confWins++;
        
        matchResults.push({ 
          opponent: matches[j].opponent, 
          result: "Win", 
          date: matches[j].date, 
          location: matches[j].location,
          isConference: isConference
        });
      } else {
        losses++;
        if (isConference) confLosses++;
        
        matchResults.push({ 
          opponent: matches[j].opponent, 
          result: "Loss", 
          date: matches[j].date, 
          location: matches[j].location,
          isConference: isConference
        });
      }
    }
    
    // Calculate win percentages
    const totalGames = wins + losses;
    const winPercent = totalGames > 0 ? wins / totalGames : 0;
    
    const totalConfGames = confWins + confLosses;
    const confWinPercent = totalConfGames > 0 ? confWins / totalConfGames : 0;
    
    // Add scenario
    scenarios.push({
      record: `${wins}-${losses}`,
      confRecord: `${confWins}-${confLosses}`,
      winPercent: winPercent.toFixed(3),
      confWinPercent: confWinPercent.toFixed(3),
      matchResults
    });
  }
  
  // Sort scenarios by conference win percentage first, then overall
  scenarios.sort((a, b) => {
    const confWinPercentA = parseFloat(a.confWinPercent);
    const confWinPercentB = parseFloat(b.confWinPercent);
    
    if (confWinPercentB !== confWinPercentA) {
      return confWinPercentB - confWinPercentA;
    }
    
    return parseFloat(b.winPercent) - parseFloat(a.winPercent);
  });
  
  // Get the best and worst possible records
  const bestScenario = scenarios[0];
  const worstScenario = scenarios[scenarios.length - 1];
  
  return {
    currentRecord: `${team.wins}-${team.losses}`,
    currentConfRecord: `${team.conf_wins}-${team.conf_losses}`,
    currentWinPercent: team.win_percent.toFixed(3),
    currentConfWinPercent: team.conf_wins / (team.conf_wins + team.conf_losses || 1),
    itaRank: team.ita_rank,
    remainingMatches: matches,
    possibleScenarios: scenarios,
    bestPossibleRecord: bestScenario.record,
    bestPossibleConfRecord: bestScenario.confRecord,
    bestPossibleWinPercent: bestScenario.winPercent,
    bestPossibleConfWinPercent: bestScenario.confWinPercent,
    worstPossibleRecord: worstScenario.record,
    worstPossibleConfRecord: worstScenario.confRecord,
    worstPossibleWinPercent: worstScenario.winPercent,
    worstPossibleConfWinPercent: worstScenario.confWinPercent
  };
}

// Apply tiebreaker rules to determine seeding
function applyTiebreakers(teams, headToHeadData) {
  // Extract the winners object for backward compatibility
  const headToHead = headToHeadData.winners || headToHeadData;
  const matchDetails = headToHeadData.matchDetails || {};
  
  // Group teams by conference win percentage
  const teamsByWinPercent = {};
  teams.forEach(team => {
    // Use conference win percentage when available, otherwise fall back to overall
    const confTotal = team.conf_wins + team.conf_losses;
    const winPercent = confTotal > 0 ? 
      (team.conf_wins / confTotal).toFixed(3) : 
      team.win_percent.toFixed(3);
    
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
          confRecord: `${tiedTeams[0].conf_wins}-${tiedTeams[0].conf_losses}`,
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
        let matchDetail = null;
        
        if (headToHead[h2hKey1]) {
          winner = headToHead[h2hKey1];
          matchDetail = matchDetails[h2hKey1];
        } else if (headToHead[h2hKey2]) {
          winner = headToHead[h2hKey2];
          matchDetail = matchDetails[h2hKey2];
        }
        
        if (winner) {
          // Found head-to-head winner
          const winnerTeam = tiedTeams.find(t => t.team === winner);
          const loserTeam = tiedTeams.find(t => t.team !== winner);
          
          let tiebreakerReason = `Head-to-head vs ${loserTeam.team}`;
          if (matchDetail) {
            tiebreakerReason += ` (${matchDetail.date} at ${matchDetail.location})`;
          }
          
          seedings.push({
            seed: seedings.length + 1,
            team: winnerTeam.team,
            record: `${winnerTeam.wins}-${winnerTeam.losses}`,
            confRecord: `${winnerTeam.conf_wins}-${winnerTeam.conf_losses}`,
            winPercent: parseFloat(winPercent),
            tiebreaker: tiebreakerReason
          });
          
          seedings.push({
            seed: seedings.length + 1,
            team: loserTeam.team,
            record: `${loserTeam.wins}-${loserTeam.losses}`,
            confRecord: `${loserTeam.conf_wins}-${loserTeam.conf_losses}`,
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
            confRecord: `${tiedTeams[0].conf_wins}-${tiedTeams[0].conf_losses}`,
            winPercent: parseFloat(winPercent),
            tiebreaker: `ITA ranking (#${tiedTeams[0].ita_rank} vs #${tiedTeams[1].ita_rank})`
          });
          
          seedings.push({
            seed: seedings.length + 1,
            team: tiedTeams[1].team,
            record: `${tiedTeams[1].wins}-${tiedTeams[1].losses}`,
            confRecord: `${tiedTeams[1].conf_wins}-${tiedTeams[1].conf_losses}`,
            winPercent: parseFloat(winPercent),
            tiebreaker: `Lower ITA ranking (#${tiedTeams[1].ita_rank} vs #${tiedTeams[0].ita_rank})`
          });
        }
      }
      
      // If more than two teams tied (mini round-robin)
      if (tiedTeams.length > 2) {
        // Calculate mini round-robin records
        const miniRecords = {};
        const processedMiniMatches = new Set(); // Track matches processed within this tiebreaker
        
        // Initialize records
        tiedTeams.forEach(team => {
          miniRecords[team.team] = { 
            wins: 0, 
            losses: 0, 
            winPercent: 0,
            matches: [] // Store details of the matches for reporting
          };
        });
        
        // Calculate wins and losses in games against each other
        tiedTeams.forEach(team1 => {
          tiedTeams.forEach(team2 => {
            if (team1.team !== team2.team) {
              const h2hKey1 = `${team1.team} vs ${team2.team}`;
              const h2hKey2 = `${team2.team} vs ${team1.team}`;
              
              // Check both possible keys
              let winner = null;
              let matchDetail = null;
              
              if (headToHead[h2hKey1]) {
                winner = headToHead[h2hKey1];
                matchDetail = matchDetails[h2hKey1];
              } else if (headToHead[h2hKey2]) {
                winner = headToHead[h2hKey2];
                matchDetail = matchDetails[h2hKey2];
              }
              
              if (winner && matchDetail?.date) { // Ensure we have match details and date
                // Create a consistent key for deduplication within this tiebreaker step
                const sortedTeamsMini = [team1.team, team2.team].sort();
                const miniMatchKey = `${sortedTeamsMini[0]}|${sortedTeamsMini[1]}|${matchDetail.date}`;

                // Only process this specific match pair once for the mini round-robin
                if (!processedMiniMatches.has(miniMatchKey)) {
                    processedMiniMatches.add(miniMatchKey);

                    if (winner === team1.team) {
                      miniRecords[team1.team].wins++;
                      miniRecords[team2.team].losses++;
                      miniRecords[team1.team].matches.push({
                        opponent: team2.team,
                        result: 'W',
                        date: matchDetail.date,
                        location: matchDetail.location
                      });
                      miniRecords[team2.team].matches.push({
                        opponent: team1.team,
                        result: 'L',
                        date: matchDetail.date,
                        location: matchDetail.location
                      });
                    } else {
                      miniRecords[team1.team].losses++;
                      miniRecords[team2.team].wins++;
                      miniRecords[team1.team].matches.push({
                        opponent: team2.team,
                        result: 'L',
                        date: matchDetail.date,
                        location: matchDetail.location
                      });
                      miniRecords[team2.team].matches.push({
                        opponent: team1.team,
                        result: 'W',
                        date: matchDetail.date,
                        location: matchDetail.location
                      });
                    }
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
          
          // Create a detailed explanation of the mini round-robin
          let matchDetails = '';
          if (record.matches.length > 0) {
            matchDetails = ' - ' + record.matches.map(m => 
              `${m.result} vs ${m.opponent} (${m.date})`
            ).join(', ');
          }
          
          seedings.push({
            seed: seedings.length + 1,
            team: team.team,
            record: `${team.wins}-${team.losses}`,
            confRecord: `${team.conf_wins}-${team.conf_losses}`,
            winPercent: parseFloat(winPercent),
            tiebreaker: `Mini round-robin: ${record.wins}-${record.losses} (${(record.winPercent * 100).toFixed(1)}%)${matchDetails}`,
            miniRoundRobinRecord: `${record.wins}-${record.losses}`,
            miniRoundRobinPercent: record.winPercent,
            miniRoundRobinMatches: record.matches
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
async function generateComprehensiveAnalysis(sport = 'womens-tennis') {
  try {
    // Get data from database
    const currentStandings = await getCurrentStandings(sport);
    
    if (!currentStandings || currentStandings.length === 0) {
      return {
        error: `No standings data found for ${sport}`,
        sport
      };
    }
    
    const remainingMatches = await getRemainingMatches(sport);
    const headToHeadData = await getHeadToHead(sport);
    
    // For backward compatibility
    const headToHead = headToHeadData.winners || headToHeadData;
    
    // Generate analysis
    const currentSeedings = applyTiebreakers(currentStandings, headToHeadData);
    const seedingRanges = calculateSeedingRanges(currentStandings, remainingMatches, headToHead);
    const keyMatches = identifyKeyMatches(currentStandings, remainingMatches);
    
    // Generate scenarios for all teams (limit to teams with remaining matches to avoid excessive computation)
    const teamScenarios = {};
    const teamsWithRemainingMatches = currentStandings.filter(team => 
      remainingMatches[team.team] && remainingMatches[team.team].length > 0
    );
    
    // For teams with too many remaining matches, we'll limit the scenario generation
    teamsWithRemainingMatches.forEach(team => {
      const matches = remainingMatches[team.team] || [];
      
      // If there are too many matches, limit the combinations we analyze
      // 2^10 = 1024 combinations, which is manageable
      if (matches.length > 10) {
        console.warn(`Team ${team.team} has ${matches.length} remaining matches. Limiting analysis to 10 matches.`);
        const limitedMatches = matches.slice(0, 10);
        teamScenarios[team.team] = generateTeamScenarios(team.team, team, limitedMatches);
        teamScenarios[team.team].truncated = true;
      } else {
        teamScenarios[team.team] = generateTeamScenarios(team.team, team, matches);
      }
    });
    
    // For teams with no remaining matches, just provide current status
    currentStandings
      .filter(team => !teamsWithRemainingMatches.some(t => t.team === team.team))
      .forEach(team => {
        teamScenarios[team.team] = {
          currentRecord: `${team.wins}-${team.losses}`,
          currentConfRecord: `${team.conf_wins}-${team.conf_losses}`,
          currentWinPercent: team.win_percent.toFixed(3),
          itaRank: team.ita_rank,
          remainingMatches: [],
          possibleScenarios: [{
            record: `${team.wins}-${team.losses}`,
            confRecord: `${team.conf_wins}-${team.conf_losses}`,
            winPercent: team.win_percent.toFixed(3),
            confWinPercent: (team.conf_wins / (team.conf_wins + team.conf_losses)).toFixed(3),
            matchResults: []
          }],
          bestPossibleRecord: `${team.wins}-${team.losses}`,
          bestPossibleWinPercent: team.win_percent.toFixed(3),
          worstPossibleRecord: `${team.wins}-${team.losses}`,
          worstPossibleWinPercent: team.win_percent.toFixed(3)
        };
      });
    
    return {
      sport,
      currentDate: new Date().toISOString(),
      currentStandings,
      remainingMatches,
      headToHead: headToHeadData,
      currentSeedings,
      seedingRanges,
      keyMatches,
      teamScenarios
    };
  } catch (error) {
    console.error(`Error generating comprehensive analysis for ${sport}:`, error);
    return {
      error: `Failed to generate analysis: ${error.message}`,
      sport
    };
  }
}

// Convenience functions for specific sports
async function getMensTennisAnalysis() {
  return generateComprehensiveAnalysis('mens-tennis');
}

async function getWomensTennisAnalysis() {
  return generateComprehensiveAnalysis('womens-tennis');
}

module.exports = {
  generateComprehensiveAnalysis,
  generateTeamScenarios,
  applyTiebreakers,
  calculateSeedingRanges,
  identifyKeyMatches,
  getCurrentStandings,
  getRemainingMatches,
  getHeadToHead,
  getMensTennisAnalysis,
  getWomensTennisAnalysis
}; 