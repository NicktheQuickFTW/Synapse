/**
 * Manual Agent Registration Tool
 * 
 * This command-line tool allows manual registration of agents
 * for specific sports with customized capabilities.
 */

const readline = require('readline');
const sportMetadata = require('../modules/athletic-competition/sport-metadata');
const { v4: uuidv4 } = require('uuid');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for input
 * @param {string} question - Question to ask
 * @returns {Promise<string>} - User's response
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * List available sports
 */
async function listSports() {
  const sports = await sportMetadata.getSports();
  console.log('\nAvailable Sports:');
  console.log('----------------');
  sports.forEach(sport => {
    console.log(`${sport.sport_id}: ${sport.sport_name}`);
  });
  return sports;
}

/**
 * List available agent types
 */
function listAgentTypes() {
  const agentTypes = [
    'scheduling',
    'analysis',
    'clustering',
    'reporting',
    'optimization',
    'custom'
  ];
  
  console.log('\nAgent Types:');
  console.log('------------');
  agentTypes.forEach(type => {
    console.log(`- ${type}`);
  });
  
  return agentTypes;
}

/**
 * List common capabilities
 */
function listCapabilities() {
  const capabilities = [
    'scheduling',
    'analysis',
    'clustering',
    'optimization',
    'reporting',
    'visualization',
    'geographic_optimization',
    'travel_optimization',
    'tv_optimization',
    'recovery_management',
    'weather_contingency',
    'rival_preservation'
  ];
  
  console.log('\nCommon Capabilities:');
  console.log('-------------------');
  capabilities.forEach(capability => {
    console.log(`- ${capability}`);
  });
  
  return capabilities;
}

/**
 * Register an agent based on user input
 */
async function registerAgent() {
  try {
    console.log('\n==============================');
    console.log('Manual Agent Registration Tool');
    console.log('==============================\n');
    
    // List sports
    const sports = await listSports();
    
    // Get sport ID
    const sportIdInput = await prompt('\nEnter sport ID: ');
    const sportId = parseInt(sportIdInput, 10);
    
    // Validate sport ID
    const selectedSport = sports.find(sport => sport.sport_id === sportId);
    if (!selectedSport) {
      console.log('\nInvalid sport ID. Please try again.');
      return;
    }
    
    // List agent types
    listAgentTypes();
    
    // Get agent type
    const agentType = await prompt('\nEnter agent type: ');
    
    // List common capabilities
    listCapabilities();
    
    // Get capabilities
    console.log('\nEnter capabilities (comma-separated list):');
    const capabilitiesInput = await prompt('> ');
    
    // Parse capabilities
    const capabilities = {};
    capabilitiesInput.split(',').forEach(capability => {
      const trimmed = capability.trim();
      if (trimmed) {
        capabilities[trimmed] = true;
      }
    });
    
    // Confirm creation
    console.log('\nAbout to create agent with the following details:');
    console.log('------------------------------------------------');
    console.log(`Sport: ${selectedSport.sport_name} (ID: ${selectedSport.sport_id})`);
    console.log(`Agent Type: ${agentType}`);
    console.log('Capabilities:', capabilities);
    
    const confirm = await prompt('\nCreate agent? (y/n): ');
    
    if (confirm.toLowerCase() === 'y') {
      // Register the agent
      const agent = await sportMetadata.registerAgent({
        agent_id: uuidv4(),
        sport_id: sportId,
        capabilities: capabilities,
        agent_type: agentType,
        is_active: true
      });
      
      console.log('\nAgent successfully registered!');
      console.log('Agent ID:', agent.agent_id);
    } else {
      console.log('\nAgent registration cancelled.');
    }
  } catch (error) {
    console.error('Error registering agent:', error);
  } finally {
    rl.close();
  }
}

/**
 * Main function
 */
async function main() {
  await registerAgent();
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  registerAgent
}; 