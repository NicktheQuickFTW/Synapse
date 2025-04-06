/**
 * FlexTime Scheduling Engine - Geographic Clustering Module
 * 
 * Implements advanced geographic clustering for optimizing sports schedules
 * by grouping teams regionally to minimize travel distances.
 */

const winston = require('winston');
const logger = require('../../../shared/utils/logger');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'flextime-clustering' },
  transports: [
    new winston.transports.File({ filename: 'logs/flextime-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/flextime-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

/**
 * Group teams by geographic region with consideration for preferred partners
 * @param {Array} teams - List of teams
 * @param {Object} options - Clustering options
 * @returns {Array} Grouped team clusters
 */
exports.groupTeamsByRegion = (teams, options = {}) => {
  logger.info('Grouping teams by region', { teamCount: teams.length });
  
  // Validate teams have coordinates
  const teamsWithCoordinates = teams.filter(team => 
    team.coordinates && team.coordinates.lat && team.coordinates.lng
  );
  
  if (teamsWithCoordinates.length < teams.length) {
    logger.warn('Some teams missing coordinates', { 
      missingCount: teams.length - teamsWithCoordinates.length 
    });
  }
  
  // Default options
  const defaultOptions = {
    preferredPartners: true,
    clusterRadius: 300, // miles
    minClusterSize: 2,
    maxClusterSize: 4,
    balanceCompetitiveStrength: true,
    allowStrategicOutliers: false
  };
  
  const clusterOptions = { ...defaultOptions, ...options };
  
  // Initialize clusters
  let clusters = [];
  
  // 1. First pass: Create initial clusters based on distance
  if (clusterOptions.preferredPartners && options.preferredPartnerships) {
    // Start with predefined partnerships if available
    clusters = createClustersFromPartnerships(teams, options.preferredPartnerships);
  } else {
    // Create clusters based on geographic proximity
    clusters = createDistanceBasedClusters(
      teamsWithCoordinates, 
      clusterOptions.clusterRadius,
      clusterOptions.minClusterSize,
      clusterOptions.maxClusterSize
    );
  }
  
  // 2. Second pass: Refine clusters
  if (clusterOptions.balanceCompetitiveStrength && options.teamStrengths) {
    clusters = balanceClusterStrength(clusters, options.teamStrengths);
  }
  
  // 3. Third pass: Handle special cases (religious policies, venue sharing, etc.)
  if (options.specialConstraints) {
    clusters = applySpecialConstraints(clusters, options.specialConstraints);
  }
  
  // 4. Fourth pass: Strategic outliers if enabled
  if (clusterOptions.allowStrategicOutliers && options.strategicOutliers) {
    clusters = addStrategicOutliers(clusters, options.strategicOutliers);
  }
  
  // Process teams that couldn't be clustered
  const allClusteredTeams = new Set(clusters.flat().map(team => team.id));
  const unclustered = teams.filter(team => !allClusteredTeams.has(team.id));
  
  if (unclustered.length > 0) {
    logger.info('Some teams could not be clustered', { unclusteredCount: unclustered.length });
    // Add each unclustered team as its own cluster
    unclustered.forEach(team => {
      clusters.push([team]);
    });
  }
  
  // Log clustering results
  logger.info('Team clustering complete', { 
    clusterCount: clusters.length,
    averageClusterSize: clusters.length > 0 ? 
      clusters.reduce((sum, cluster) => sum + cluster.length, 0) / clusters.length : 0
  });
  
  return clusters;
};

/**
 * Schedule back-to-back road trips for a cluster of teams
 * @param {Array} cluster - Cluster of teams
 * @param {Object} schedule - Current schedule
 * @param {Object} config - Configuration
 * @returns {Object} Updated schedule with optimized trips
 */
exports.scheduleBackToBackRoadTrips = (cluster, schedule, config) => {
  logger.info('Scheduling back-to-back road trips for cluster', { 
    clusterSize: cluster.length 
  });
  
  // Deep copy schedule to avoid modifying original
  const updatedSchedule = JSON.parse(JSON.stringify(schedule));
  
  // Get team IDs from cluster
  const clusterTeamIds = cluster.map(team => team.id);
  
  // Generate team schedules (chronological game list for each team)
  const teamSchedules = {};
  clusterTeamIds.forEach(teamId => {
    teamSchedules[teamId] = [];
  });
  
  // Collect all games involving cluster teams
  updatedSchedule.weeks.forEach(week => {
    week.matchups.forEach(matchup => {
      // Process games where either team is in the cluster
      if (clusterTeamIds.includes(matchup.homeTeam) || clusterTeamIds.includes(matchup.awayTeam)) {
        if (clusterTeamIds.includes(matchup.awayTeam)) {
          // Process away team
          if (!teamSchedules[matchup.awayTeam]) {
            teamSchedules[matchup.awayTeam] = [];
          }
          
          teamSchedules[matchup.awayTeam].push({
            matchupId: matchup.id,
            opponent: matchup.homeTeam,
            date: matchup.date,
            isHome: false,
            week: matchup.week
          });
        }
        
        if (clusterTeamIds.includes(matchup.homeTeam)) {
          // Process home team
          if (!teamSchedules[matchup.homeTeam]) {
            teamSchedules[matchup.homeTeam] = [];
          }
          
          teamSchedules[matchup.homeTeam].push({
            matchupId: matchup.id,
            opponent: matchup.awayTeam,
            date: matchup.date,
            isHome: true,
            week: matchup.week
          });
        }
      }
    });
  });
  
  // Sort each team's schedule chronologically
  Object.keys(teamSchedules).forEach(teamId => {
    teamSchedules[teamId].sort((a, b) => new Date(a.date) - new Date(b.date));
  });
  
  // Find potential road trip opportunities for each team
  clusterTeamIds.forEach(teamId => {
    const games = teamSchedules[teamId];
    
    // Look for single away games that could be part of a road trip
    for (let i = 0; i < games.length; i++) {
      const currentGame = games[i];
      
      // Only consider away games
      if (!currentGame.isHome) {
        // Look for other away games within 3 days (forward)
        const roadTripCandidates = [];
        
        for (let j = i + 1; j < games.length; j++) {
          const nextGame = games[j];
          
          if (!nextGame.isHome) {
            // Calculate days between games
            const daysBetween = Math.round(
              (new Date(nextGame.date) - new Date(currentGame.date)) / (1000 * 60 * 60 * 24)
            );
            
            // If within 3 days, could be part of a road trip
            if (daysBetween >= 1 && daysBetween <= 3) {
              roadTripCandidates.push(nextGame);
            } else if (daysBetween > 3) {
              // Stop looking once we're beyond 3 days
              break;
            }
          } else {
            // Stop if we hit a home game
            break;
          }
        }
        
        // If we found road trip candidates, update the schedule
        if (roadTripCandidates.length > 0) {
          logger.debug(`Found road trip opportunity for ${teamId} with ${roadTripCandidates.length} additional games`);
          
          // Calculate optimal road trip order based on geography if we have coordinates
          if (config.teams && config.teams.length > 0) {
            // Find team objects with coordinates
            const teamMap = {};
            config.teams.forEach(team => {
              if (team.coordinates) {
                teamMap[team.id] = team;
              }
            });
            
            // Reorder games to minimize travel
            if (Object.keys(teamMap).length > 0) {
              optimizeRoadTripOrder(currentGame, roadTripCandidates, teamMap);
            }
          }
        }
      }
    }
  });
  
  // Apply updates to the schedule
  // Note: The actual updates would be more complex in a real implementation
  // as we would need to adjust multiple matchups in the schedule
  
  return updatedSchedule;
};

/**
 * Calculate Cluster Score using the dynamic weighting formula
 * @param {Array} cluster - Cluster of teams
 * @param {Object} options - Scoring options
 * @returns {number} Cluster score (higher is better)
 */
exports.calculateClusterScore = (cluster, options) => {
  const baseTravelCost = options.baseTravelCost || 0;
  const clusterTravelCost = options.clusterTravelCost || 0;
  const revenueImpactFactor = options.revenueImpactFactor || 1;
  
  // Apply the formula: Cluster Score = (Base Travel Cost - Cluster Travel Cost) / Revenue Impact Factor
  const score = (baseTravelCost - clusterTravelCost) / revenueImpactFactor;
  
  return score;
};

/**
 * Create clusters from predefined partnerships
 * @param {Array} teams - List of teams
 * @param {Array} partnerships - List of partnership pairs
 * @returns {Array} Clusters based on partnerships
 */
function createClustersFromPartnerships(teams, partnerships) {
  logger.debug('Creating clusters from predefined partnerships');
  
  const teamMap = {};
  teams.forEach(team => {
    teamMap[team.id] = team;
  });
  
  const clusters = [];
  const clusteredTeamIds = new Set();
  
  // Process each partnership pair
  partnerships.forEach(partnership => {
    const team1 = teamMap[partnership.team1];
    const team2 = teamMap[partnership.team2];
    
    if (team1 && team2 && !clusteredTeamIds.has(team1.id) && !clusteredTeamIds.has(team2.id)) {
      // Create new cluster
      const cluster = [team1, team2];
      clusters.push(cluster);
      
      // Mark teams as clustered
      clusteredTeamIds.add(team1.id);
      clusteredTeamIds.add(team2.id);
    }
  });
  
  // Process remaining unclustered teams
  const unclustered = teams.filter(team => !clusteredTeamIds.has(team.id));
  
  // Create additional clusters based on distance
  if (unclustered.length > 0) {
    const additionalClusters = createDistanceBasedClusters(unclustered, 300, 2, 4);
    clusters.push(...additionalClusters);
  }
  
  return clusters;
}

/**
 * Create clusters based on geographic distance
 * @param {Array} teams - List of teams with coordinates
 * @param {number} maxDistance - Maximum distance in miles
 * @param {number} minSize - Minimum cluster size
 * @param {number} maxSize - Maximum cluster size
 * @returns {Array} Distance-based clusters
 */
function createDistanceBasedClusters(teams, maxDistance, minSize, maxSize) {
  logger.debug('Creating clusters based on geographic distance');
  
  if (teams.length === 0) return [];
  
  // Convert miles to kilometers for calculations
  const maxDistanceKm = maxDistance * 1.60934;
  
  const clusters = [];
  const remainingTeams = [...teams];
  
  while (remainingTeams.length > 0) {
    // Start a new cluster with the first team
    const seedTeam = remainingTeams.shift();
    const cluster = [seedTeam];
    
    // Find nearby teams for this cluster
    let i = 0;
    while (i < remainingTeams.length && cluster.length < maxSize) {
      const candidate = remainingTeams[i];
      
      // Calculate distance between seed and candidate
      const distance = calculateEuclideanDistance(
        seedTeam.coordinates,
        candidate.coordinates
      ) / 1000; // Convert meters to kilometers
      
      if (distance <= maxDistanceKm) {
        // Add to cluster and remove from remaining
        cluster.push(candidate);
        remainingTeams.splice(i, 1);
      } else {
        // Move to next candidate
        i++;
      }
    }
    
    // Only keep clusters meeting minimum size
    if (cluster.length >= minSize) {
      clusters.push(cluster);
    } else {
      // For small clusters, we'll handle them later
      cluster.forEach(team => remainingTeams.push(team));
    }
  }
  
  // Handle remaining teams that couldn't form proper clusters
  if (remainingTeams.length > 0) {
    // If we have enough for a minimum cluster, create it
    if (remainingTeams.length >= minSize) {
      clusters.push(remainingTeams);
    } else {
      // Otherwise, add them to the nearest existing cluster
      remainingTeams.forEach(team => {
        let bestCluster = null;
        let bestDistance = Infinity;
        
        clusters.forEach(cluster => {
          cluster.forEach(clusterTeam => {
            const distance = calculateEuclideanDistance(
              team.coordinates,
              clusterTeam.coordinates
            ) / 1000; // Convert meters to kilometers
            
            if (distance < bestDistance) {
              bestDistance = distance;
              bestCluster = cluster;
            }
          });
        });
        
        if (bestCluster) {
          bestCluster.push(team);
        } else {
          // If still no cluster, create a singleton
          clusters.push([team]);
        }
      });
    }
  }
  
  return clusters;
}

/**
 * Calculate Euclidean distance between two points
 * @param {Object} point1 - First point {lat, lng}
 * @param {Object} point2 - Second point {lat, lng}
 * @returns {number} Distance in meters
 */
function calculateEuclideanDistance(point1, point2) {
  const latDiff = point1.lat - point2.lat;
  const lngDiff = point1.lng - point2.lng;
  
  // Rough conversion to meters (varies by latitude)
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111319;
}

/**
 * Balance competitive strength across clusters
 * @param {Array} clusters - Team clusters
 * @param {Object} teamStrengths - Team strength ratings
 * @returns {Array} Balanced clusters
 */
function balanceClusterStrength(clusters, teamStrengths) {
  logger.debug('Balancing competitive strength across clusters');
  
  // Calculate current strength of each cluster
  const clusterStrengths = clusters.map(cluster => {
    let totalStrength = 0;
    cluster.forEach(team => {
      totalStrength += (teamStrengths[team.id] || 50); // Default to average (50) if unknown
    });
    
    return {
      cluster,
      avgStrength: totalStrength / cluster.length,
      totalStrength
    };
  });
  
  // Sort clusters by average strength
  clusterStrengths.sort((a, b) => b.avgStrength - a.avgStrength);
  
  // If significant imbalance exists, try to rebalance
  const strongestCluster = clusterStrengths[0];
  const weakestCluster = clusterStrengths[clusterStrengths.length - 1];
  
  if (strongestCluster.avgStrength - weakestCluster.avgStrength > 10) {
    // Find strongest team in strongest cluster
    const strongestTeam = strongestCluster.cluster.reduce(
      (strongest, current) => 
        (teamStrengths[current.id] > teamStrengths[strongest.id]) ? current : strongest,
      strongestCluster.cluster[0]
    );
    
    // Move to weakest cluster if not too far geographically
    // This would need more sophisticated logic in a real implementation
    weakestCluster.cluster.push(strongestTeam);
    strongestCluster.cluster.splice(
      strongestCluster.cluster.findIndex(t => t.id === strongestTeam.id),
      1
    );
  }
  
  // Return balanced clusters
  return clusterStrengths.map(cs => cs.cluster);
}

/**
 * Apply special constraints to clusters
 * @param {Array} clusters - Team clusters
 * @param {Array} constraints - Special constraints
 * @returns {Array} Updated clusters
 */
function applySpecialConstraints(clusters, constraints) {
  logger.debug('Applying special constraints to clusters');
  
  // For each constraint, check if it affects our clusters
  constraints.forEach(constraint => {
    switch (constraint.type) {
      case 'religious_policy':
        // Example: BYU no-Sunday play policy
        clusters = handleReligiousPolicy(clusters, constraint);
        break;
        
      case 'venue_sharing':
        // Example: Teams sharing the same venue
        clusters = handleVenueSharing(clusters, constraint);
        break;
        
      case 'travel_cost':
        // Example: High travel cost teams get special treatment
        clusters = handleTravelCost(clusters, constraint);
        break;
    }
  });
  
  return clusters;
}

/**
 * Handle religious policy constraints
 * @param {Array} clusters - Team clusters
 * @param {Object} constraint - Religious policy constraint
 * @returns {Array} Updated clusters
 */
function handleReligiousPolicy(clusters, constraint) {
  // Example implementation: Ensure BYU is paired with Utah/Colorado
  const religiousTeamId = constraint.teamId;
  
  // Find team in clusters
  let religiousTeamCluster = null;
  
  clusters.forEach((cluster, index) => {
    const teamIndex = cluster.findIndex(team => team.id === religiousTeamId);
    if (teamIndex !== -1) {
      religiousTeamCluster = { cluster, index, teamIndex };
    }
  });
  
  if (religiousTeamCluster) {
    // Check if preferred partner is not in the same cluster
    const preferredPartnerIds = constraint.preferredPartners || [];
    const hasPreferredPartner = religiousTeamCluster.cluster.some(
      team => preferredPartnerIds.includes(team.id)
    );
    
    if (!hasPreferredPartner && preferredPartnerIds.length > 0) {
      // Find cluster with preferred partner
      const partnerClusters = clusters.filter((cluster, index) => 
        index !== religiousTeamCluster.index && 
        cluster.some(team => preferredPartnerIds.includes(team.id))
      );
      
      if (partnerClusters.length > 0) {
        // Move religious team to partner cluster
        const partnerCluster = partnerClusters[0];
        const religiousTeam = religiousTeamCluster.cluster[religiousTeamCluster.teamIndex];
        
        // Remove from original cluster
        religiousTeamCluster.cluster.splice(religiousTeamCluster.teamIndex, 1);
        
        // Add to partner cluster
        partnerCluster.push(religiousTeam);
      }
    }
  }
  
  return clusters;
}

/**
 * Handle venue sharing constraints
 * @param {Array} clusters - Team clusters
 * @param {Object} constraint - Venue sharing constraint
 * @returns {Array} Updated clusters
 */
function handleVenueSharing(clusters, constraint) {
  // Example: Teams sharing venues should be in the same cluster
  const sharingTeamIds = constraint.teamIds || [];
  
  if (sharingTeamIds.length < 2) return clusters;
  
  // Find which clusters contain these teams
  const teamLocations = {};
  
  clusters.forEach((cluster, clusterIndex) => {
    cluster.forEach((team, teamIndex) => {
      if (sharingTeamIds.includes(team.id)) {
        teamLocations[team.id] = { clusterIndex, teamIndex };
      }
    });
  });
  
  // If teams are in different clusters, consolidate them
  const uniqueClusters = new Set(
    Object.values(teamLocations).map(location => location.clusterIndex)
  );
  
  if (uniqueClusters.size > 1) {
    // Choose the first cluster as the target
    const targetClusterIndex = Object.values(teamLocations)[0].clusterIndex;
    
    // Move all teams to the target cluster
    Object.entries(teamLocations).forEach(([teamId, location]) => {
      if (location.clusterIndex !== targetClusterIndex) {
        const team = clusters[location.clusterIndex][location.teamIndex];
        
        // Remove from original cluster
        clusters[location.clusterIndex].splice(location.teamIndex, 1);
        
        // Add to target cluster
        clusters[targetClusterIndex].push(team);
      }
    });
    
    // Clean up empty clusters
    return clusters.filter(cluster => cluster.length > 0);
  }
  
  return clusters;
}

/**
 * Handle travel cost constraints
 * @param {Array} clusters - Team clusters
 * @param {Object} constraint - Travel cost constraint
 * @returns {Array} Updated clusters
 */
function handleTravelCost(clusters, constraint) {
  // Example: High travel teams should always be clustered
  // (e.g. West Virginia with Cincinnati/UCF)
  const highCostTeamId = constraint.teamId;
  const preferredPartnerIds = constraint.preferredPartners || [];
  
  // Find team in clusters
  let highCostTeamCluster = null;
  
  clusters.forEach((cluster, index) => {
    const teamIndex = cluster.findIndex(team => team.id === highCostTeamId);
    if (teamIndex !== -1) {
      highCostTeamCluster = { cluster, index, teamIndex };
    }
  });
  
  if (highCostTeamCluster) {
    // Check if at least one preferred partner is in the same cluster
    const hasPreferredPartner = highCostTeamCluster.cluster.some(
      team => preferredPartnerIds.includes(team.id)
    );
    
    if (!hasPreferredPartner && preferredPartnerIds.length > 0) {
      // Find preferred partners in other clusters
      const partnerLocations = {};
      
      clusters.forEach((cluster, clusterIndex) => {
        if (clusterIndex === highCostTeamCluster.index) return;
        
        cluster.forEach((team, teamIndex) => {
          if (preferredPartnerIds.includes(team.id)) {
            partnerLocations[team.id] = { clusterIndex, teamIndex };
          }
        });
      });
      
      // If we found partners, move one to high-cost team's cluster
      if (Object.keys(partnerLocations).length > 0) {
        const partnerId = Object.keys(partnerLocations)[0];
        const location = partnerLocations[partnerId];
        
        const partner = clusters[location.clusterIndex][location.teamIndex];
        
        // Remove from original cluster
        clusters[location.clusterIndex].splice(location.teamIndex, 1);
        
        // Add to high-cost team's cluster
        highCostTeamCluster.cluster.push(partner);
      }
    }
  }
  
  return clusters;
}

/**
 * Add strategic outliers to clusters
 * @param {Array} clusters - Team clusters
 * @param {Array} outliers - Strategic outlier configurations
 * @returns {Array} Updated clusters
 */
function addStrategicOutliers(clusters, outliers) {
  logger.debug('Adding strategic outliers to clusters');
  
  // Process each outlier configuration
  outliers.forEach(outlier => {
    const teamId = outlier.teamId;
    const targetClusterIndex = outlier.targetCluster;
    
    // Find team in clusters
    let foundTeam = null;
    let foundClusterIndex = -1;
    let foundTeamIndex = -1;
    
    clusters.forEach((cluster, clusterIndex) => {
      const teamIndex = cluster.findIndex(team => team.id === teamId);
      if (teamIndex !== -1) {
        foundTeam = cluster[teamIndex];
        foundClusterIndex = clusterIndex;
        foundTeamIndex = teamIndex;
      }
    });
    
    // If team found and not already in target cluster
    if (foundTeam && foundClusterIndex !== targetClusterIndex) {
      // Remove from original cluster
      clusters[foundClusterIndex].splice(foundTeamIndex, 1);
      
      // Add to target cluster
      if (targetClusterIndex >= 0 && targetClusterIndex < clusters.length) {
        clusters[targetClusterIndex].push(foundTeam);
      }
    }
  });
  
  // Clean up empty clusters
  return clusters.filter(cluster => cluster.length > 0);
}

/**
 * Optimize the order of road trip games to minimize travel distance
 * @param {Object} firstGame - First game in the road trip
 * @param {Array} roadTripGames - Other games in the road trip
 * @param {Object} teamMap - Map of team data with coordinates
 */
function optimizeRoadTripOrder(firstGame, roadTripGames, teamMap) {
  // Start from first game's opponent location
  let currentLocation = teamMap[firstGame.opponent]?.coordinates;
  
  if (!currentLocation) return roadTripGames;
  
  // Calculate distances from current location to each remaining game
  const gameDistances = roadTripGames.map(game => {
    const opponentLocation = teamMap[game.opponent]?.coordinates;
    
    if (!opponentLocation) return { game, distance: Infinity };
    
    const distance = calculateEuclideanDistance(currentLocation, opponentLocation);
    return { game, distance };
  });
  
  // Sort by distance (closest first)
  gameDistances.sort((a, b) => a.distance - b.distance);
  
  // Return ordered list of games
  return gameDistances.map(item => item.game);
} 