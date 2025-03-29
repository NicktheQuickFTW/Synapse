/**
 * Script to register specific agents for each Big 12 sport
 * 
 * This script creates specialized agents for each Big 12 sport
 * with specific capabilities relevant to that sport.
 */

const sportMetadata = require('../modules/athletic-competition/sport-metadata');
const { v4: uuidv4 } = require('uuid');
const logger = require('../shared/utils/logger');

// Big 12 sports configuration
const BIG12_SPORTS = [
  {
    name: 'basketball',
    displayName: 'Men\'s Basketball',
    capabilities: {
      clustering: true,
      scheduling: true,
      optimization: true,
      analysis: true,
      tv_optimization: true,
      net_impact_analysis: true,
      recovery_management: true
    }
  },
  {
    name: 'basketball-womens',
    displayName: 'Women\'s Basketball',
    capabilities: {
      clustering: true,
      scheduling: true,
      optimization: true,
      analysis: true,
      tv_optimization: true,
      net_impact_analysis: true,
      recovery_management: true
    }
  },
  {
    name: 'football',
    displayName: 'Football',
    capabilities: {
      scheduling: true,
      optimization: true,
      analysis: true,
      tv_revenue_maximization: true,
      travel_optimization: false,  // Less important for football
      rivalry_preservation: true
    }
  },
  {
    name: 'baseball',
    displayName: 'Baseball',
    capabilities: {
      clustering: true,
      scheduling: true,
      series_management: true,
      weather_contingency: true,
      travel_optimization: true,
      doubleheader_management: true
    }
  },
  {
    name: 'volleyball',
    displayName: 'Volleyball',
    capabilities: {
      clustering: true,
      scheduling: true,
      recovery_management: true,
      travel_optimization: true,
      back_to_back_management: true
    }
  },
  {
    name: 'soccer',
    displayName: 'Soccer',
    capabilities: {
      clustering: true,
      scheduling: true,
      weather_contingency: true,
      field_condition_monitoring: true,
      recovery_management: true
    }
  },
  {
    name: 'wrestling',
    displayName: 'Wrestling',
    capabilities: {
      clustering: true,
      dual_meet_optimization: true,
      weight_management: true,
      affiliate_school_integration: true
    }
  },
  {
    name: 'tennis',
    displayName: 'Tennis',
    capabilities: {
      clustering: true,
      indoor_outdoor_management: true,
      court_availability_optimization: true,
      travel_optimization: true
    }
  },
  {
    name: 'track',
    displayName: 'Track & Field',
    capabilities: {
      meet_clustering: true,
      qualification_tracking: true,
      indoor_outdoor_season_transition: true
    }
  },
  {
    name: 'swimming',
    displayName: 'Swimming & Diving',
    capabilities: {
      meet_optimization: true,
      facility_coordination: true,
      travel_optimization: true
    }
  },
  {
    name: 'golf',
    displayName: 'Golf',
    capabilities: {
      tournament_scheduling: true,
      course_rotation: true,
      travel_optimization: true,
      weather_contingency: true
    }
  }
];

/**
 * Register Big 12 sports in the database if they don't exist
 */
async function registerBig12Sports() {
  console.log('Registering Big 12 sports...');
  
  const existingSports = await sportMetadata.getSports();
  const existingSportNames = existingSports.map(sport => sport.sport_name);
  
  // Create sports that don't exist yet
  for (const sport of BIG12_SPORTS) {
    if (!existingSportNames.includes(sport.name)) {
      console.log(`Registering sport: ${sport.displayName}`);
      await sportMetadata.registerSport({
        sport_name: sport.name,
        schema_version: '1.0.0',
        claude_model_version: 'claude-3-opus-20240229'
      });
    } else {
      console.log(`Sport already exists: ${sport.displayName}`);
    }
  }
  
  return await sportMetadata.getSports();
}

/**
 * Register specialized agents for each Big 12 sport
 */
async function registerBig12Agents(sports) {
  console.log('Registering specialized agents for Big 12 sports...');
  
  // Create a map of sport names to IDs
  const sportIdMap = {};
  sports.forEach(sport => {
    sportIdMap[sport.sport_name] = sport.sport_id;
  });
  
  // Register an agent for each sport
  for (const sport of BIG12_SPORTS) {
    if (sportIdMap[sport.name]) {
      console.log(`Registering agent for ${sport.displayName}`);
      
      // Create a scheduling agent
      await sportMetadata.registerAgent({
        agent_id: uuidv4(),
        sport_id: sportIdMap[sport.name],
        capabilities: sport.capabilities,
        agent_type: 'scheduling',
        is_active: true
      });
      
      // Create an analysis agent
      await sportMetadata.registerAgent({
        agent_id: uuidv4(),
        sport_id: sportIdMap[sport.name],
        capabilities: {
          ...sport.capabilities,
          scheduling: false,
          analysis: true,
          reporting: true,
          visualization: true
        },
        agent_type: 'analysis',
        is_active: true
      });
      
      // Create a special clustering agent for sports with geographic concerns
      if (sport.capabilities.clustering) {
        await sportMetadata.registerAgent({
          agent_id: uuidv4(),
          sport_id: sportIdMap[sport.name],
          capabilities: {
            clustering: true,
            scheduling: false,
            geographic_optimization: true,
            travel_coordination: true,
            timezone_management: true
          },
          agent_type: 'clustering',
          is_active: true
        });
      }
    } else {
      console.log(`Warning: Sport ID not found for ${sport.displayName}`);
    }
  }
}

/**
 * Main function to register all Big 12 sports and agents
 */
async function main() {
  try {
    const sports = await registerBig12Sports();
    await registerBig12Agents(sports);
    console.log('Successfully registered all Big 12 sports and agents!');
  } catch (error) {
    console.error('Error registering Big 12 sports and agents:', error);
  }
}

// Run the script if called directly
if (require.main === module) {
  main().finally(() => process.exit(0));
}

module.exports = {
  registerBig12Sports,
  registerBig12Agents
}; 