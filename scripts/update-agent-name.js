/**
 * Script to update an agent's type for Men's Basketball
 * 
 * This script updates an existing agent for Men's Basketball to have
 * the agent_type "big12manual-MBB-agent"
 */

const knex = require('../db/knex');
const sportMetadata = require('../modules/athletic-competition/sport-metadata');

/**
 * Update an agent's type for Men's Basketball
 */
async function updateMensBasketballAgent() {
  try {
    console.log('Fetching sports...');
    // Get the sport ID for basketball
    const sports = await sportMetadata.getSports();
    const basketball = sports.find(sport => sport.sport_name === 'basketball');
    
    if (!basketball) {
      console.error('Error: Basketball sport not found in the database');
      return;
    }
    
    console.log('Fetching agents for Men\'s Basketball...');
    // Get all agents for basketball
    const agents = await sportMetadata.getAgents({ sport_id: basketball.sport_id });
    
    if (agents.length === 0) {
      console.error('Error: No agents found for Men\'s Basketball');
      return;
    }
    
    // If multiple agents exist, show list and ask which one to update
    console.log('\nAvailable Men\'s Basketball Agents:');
    console.log('----------------------------------');
    agents.forEach((agent, index) => {
      console.log(`${index + 1}. Agent ID: ${agent.agent_id}, Type: ${agent.agent_type}`);
      console.log(`   Capabilities: ${JSON.stringify(agent.capabilities)}`);
      console.log();
    });
    
    // Update the first agent (or you can modify to prompt for selection)
    const agentToUpdate = agents[0];
    
    console.log(`Updating agent ${agentToUpdate.agent_id} to type "big12manual-MBB-agent"...`);
    
    // Update the agent type
    const [updatedAgent] = await knex('agent_registry')
      .where({ agent_id: agentToUpdate.agent_id })
      .update({
        agent_type: 'big12manual-MBB-agent',
        updated_at: knex.fn.now()
      })
      .returning('*');
    
    console.log('\nAgent successfully updated!');
    console.log(`Agent ID: ${updatedAgent.agent_id}`);
    console.log(`New Type: ${updatedAgent.agent_type}`);
    
  } catch (error) {
    console.error('Error updating agent:', error);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await updateMensBasketballAgent();
    console.log('Agent update complete!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    // Close database connection
    knex.destroy();
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  updateMensBasketballAgent
}; 