/**
 * FlexTime Scheduling Engine - Configuration Module
 * 
 * Handles the initial configuration phase for schedule generation
 */

const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'flextime-configuration' },
  transports: [
    new winston.transports.File({ filename: 'logs/flextime-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/flextime-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

/**
 * Create a configuration object from parameters
 * @param {Object} params - Input parameters
 * @returns {Object} Configuration object
 */
exports.createConfig = (params) => {
  logger.info('Creating FlexTime configuration', { sport: params.sport });
  
  // Validate required parameters
  if (!params.sport) {
    throw new Error('Sport must be specified');
  }
  
  if (!params.seasonStart || !params.seasonEnd) {
    throw new Error('Season start and end dates must be specified');
  }
  
  if (!params.teams || !Array.isArray(params.teams) || params.teams.length < 2) {
    throw new Error('At least two teams must be specified');
  }
  
  // Build configuration object
  const config = {
    // Sport and season parameters
    sport: params.sport,
    seasonStart: new Date(params.seasonStart),
    seasonEnd: new Date(params.seasonEnd),
    championshipDate: params.championshipDate ? new Date(params.championshipDate) : null,
    
    // Team configuration
    teams: processTeams(params.teams),
    affiliates: params.affiliates || [],
    
    // Conference requirements
    gamesPerTeam: params.gamesPerTeam || getDefaultGamesPerTeam(params.sport),
    protectedRivalries: params.protectedRivalries || [],
    
    // Constraints
    institutionalConstraints: params.institutionalConstraints || [],
    academicCalendars: params.academicCalendars || {},
    venueConflicts: params.venueConflicts || [],
    existingCommitments: params.existingCommitments || [],
    
    // Optimization factors
    optimizationFactors: {
      travelEfficiency: params.optimizationFactors?.travelEfficiency || 1.0,
      competitiveBalance: params.optimizationFactors?.competitiveBalance || 1.0,
      tvRevenue: params.optimizationFactors?.tvRevenue || 1.0,
      studentWellbeing: params.optimizationFactors?.studentWellbeing || 1.0,
      ...params.optimizationFactors
    },
    
    // Format configuration
    competitionFormat: params.competitionFormat || getDefaultFormat(params.sport),
    
    // Advanced options
    simulatedAnnealingIterations: params.simulatedAnnealingIterations || 1000,
    seedValue: params.seedValue || Math.floor(Math.random() * 1000000),
    useClaudeAI: params.useClaudeAI || false,
    useMCP: params.useMCP || false,
    saveToDatabase: params.saveToDatabase || false,
    scheduleName: params.scheduleName || `${params.sport}-schedule-${new Date().toISOString().slice(0,10)}`
  };
  
  // Add geographic clustering options
  config.useGeographicClustering = params.useGeographicClustering !== false; // Default to true
  
  // Advanced clustering options
  if (params.clusteringOptions) {
    config.clusteringOptions = {
      clusterRadius: params.clusteringOptions.clusterRadius,
      minClusterSize: params.clusteringOptions.minClusterSize || 2,
      maxClusterSize: params.clusteringOptions.maxClusterSize || 4,
      preferredPartners: params.clusteringOptions.preferredPartners !== false, // Default to true
      balanceCompetitiveStrength: params.clusteringOptions.balanceCompetitiveStrength !== false, // Default to true
      allowStrategicOutliers: params.clusteringOptions.allowStrategicOutliers || false
    };
  }
  
  // Handle sport-specific configuration
  switch (params.sport.toLowerCase()) {
    case 'basketball':
      addBasketballConfig(config, params);
      break;
    case 'football':
      addFootballConfig(config, params);
      break;
    case 'baseball':
      addBaseballConfig(config, params);
      break;
    case 'volleyball':
      addVolleyballConfig(config, params);
      break;
    // ... other sports
  }
  
  // Validate configuration
  validateConfig(config);
  
  logger.info('Configuration created successfully', { 
    sport: config.sport,
    teamCount: config.teams.length
  });
  
  return config;
};

/**
 * Process and normalize team data
 * @param {Array} teams - Raw team data
 * @returns {Array} Processed team data
 */
function processTeams(teams) {
  return teams.map(team => {
    // Ensure team has required fields
    if (!team.id && !team.name) {
      throw new Error('Each team must have an id or name');
    }
    
    return {
      id: team.id || normalizeTeamName(team.name),
      name: team.name,
      location: team.location || null,
      coordinates: team.coordinates || null,
      venue: team.venue || null,
      conference: team.conference || 'Big 12',
      division: team.division || null,
      constraints: team.constraints || []
    };
  });
}

/**
 * Get default games per team based on sport
 * @param {string} sport - Sport name
 * @returns {number} Default games per team
 */
function getDefaultGamesPerTeam(sport) {
  const defaults = {
    'basketball': 20,
    'football': 9,
    'baseball': 24,
    'softball': 24,
    'volleyball': 18,
    'wrestling': 10,
    'soccer': 12
  };
  
  return defaults[sport.toLowerCase()] || 10;
}

/**
 * Get default competition format based on sport
 * @param {string} sport - Sport name
 * @returns {string} Default format
 */
function getDefaultFormat(sport) {
  const defaults = {
    'basketball': 'double-round-robin',
    'football': 'partial-round-robin',
    'wrestling': 'dual-meet',
    'volleyball': 'double-round-robin',
    'baseball': 'three-game-series',
    'softball': 'three-game-series',
    'soccer': 'single-round-robin'
  };
  
  return defaults[sport.toLowerCase()] || 'single-round-robin';
}

/**
 * Normalize team name for use as an ID
 * @param {string} name - Team name
 * @returns {string} Normalized ID
 */
function normalizeTeamName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Validate a complete configuration
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result
 */
exports.validateConfig = (config) => {
  const errors = [];
  
  // Check for required fields
  if (!config.sport) errors.push('Sport must be specified');
  if (!config.seasonStart) errors.push('Season start date must be specified');
  if (!config.seasonEnd) errors.push('Season end date must be specified');
  if (!config.teams || config.teams.length < 2) errors.push('At least two teams must be specified');
  
  // Date validation
  if (config.seasonStart && config.seasonEnd && config.seasonStart > config.seasonEnd) {
    errors.push('Season start date must be before end date');
  }
  
  if (config.championshipDate && config.championshipDate < config.seasonStart) {
    errors.push('Championship date must be during or after the season');
  }
  
  // Competition format validation
  const validFormats = [
    'single-round-robin', 
    'double-round-robin', 
    'partial-round-robin',
    'divisional',
    'three-game-series',
    'dual-meet'
  ];
  
  if (config.competitionFormat && !validFormats.includes(config.competitionFormat)) {
    errors.push(`Invalid competition format: ${config.competitionFormat}`);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
};

/**
 * Add basketball specific configuration
 * @param {Object} config - Configuration object to modify
 * @param {Object} params - Parameters from user
 */
function addBasketballConfig(config, params) {
  // Protected rivalries (special matchups that should be scheduled)
  config.protectedRivalries = params.protectedRivalries || [
    // Default Big 12 basketball rivalries
    { team1: 'kansas', team2: 'kansas-state', name: 'Sunflower Showdown' },
    { team1: 'arizona', team2: 'arizona-state', name: 'Territorial Cup' },
    { team1: 'baylor', team2: 'tcu', name: 'Revivalry' }
  ];
  
  // Special clustering configurations for basketball
  if (config.useGeographicClustering) {
    // Default to Mountain Time Zone cluster for basketball
    if (!config.clusteringOptions) {
      config.clusteringOptions = {};
    }
    
    // Pre-defined clusters for basketball
    config.clusteringOptions.predefinedClusters = params.predefinedClusters || [
      // Mountain cluster (BYU, Utah, Colorado, Arizona schools)
      { 
        name: 'Mountain Cluster',
        teamIds: ['byu', 'utah', 'colorado', 'arizona', 'arizona-state']
      },
      // Texas cluster
      {
        name: 'Texas Cluster',
        teamIds: ['baylor', 'tcu', 'texas-tech', 'houston']
      },
      // Eastern cluster
      {
        name: 'Eastern Cluster',
        teamIds: ['west-virginia', 'cincinnati', 'ucf']
      },
      // Plains cluster
      {
        name: 'Plains Cluster',
        teamIds: ['kansas', 'kansas-state', 'iowa-state', 'oklahoma-state']
      }
    ];
  }
}

// ... other sport-specific config functions ...

/**
 * Get the clustering weight balance for a specific sport
 * @param {string} sport - Sport name
 * @returns {Object} Clustering weight balance
 */
function getClusteringWeightBalance(sport) {
  // Default balance of clustering vs other factors (from FlexTime documentation)
  const weightBalances = {
    'basketball': {
      clusterEfficiency: 0.68,
      tvRevenue: 0.22,
      competitiveBalance: 0.10
    },
    'football': {
      clusterEfficiency: 0.35,
      tvRevenue: 0.55,
      competitiveBalance: 0.10
    },
    'baseball': {
      clusterEfficiency: 0.80,
      tvRevenue: 0.10,
      competitiveBalance: 0.10
    },
    'volleyball': {
      clusterEfficiency: 0.70,
      tvRevenue: 0.15,
      competitiveBalance: 0.15
    }
  };
  
  return weightBalances[sport.toLowerCase()] || weightBalances['basketball'];
} 