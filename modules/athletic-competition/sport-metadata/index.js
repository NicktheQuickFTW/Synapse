/**
 * Sport Metadata Module (Mock Version)
 * 
 * This module provides mock implementations of the sport metadata functions
 */

const knex = require('../../../db/knex');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../../shared/utils/logger');

/**
 * Register a new sport in the metadata table
 * @param {Object} sportData - Sport data to register
 * @returns {Promise<Object>} - Registered sport data
 */
exports.registerSport = async (sportData) => {
  try {
    // Check if sport already exists
    const existingSport = await knex('sport_metadata')
      .where({ sport_name: sportData.sport_name })
      .first();
    
    if (existingSport) {
      // Update existing sport
      await knex('sport_metadata')
        .where({ sport_id: existingSport.sport_id })
        .update({
          schema_version: sportData.schema_version || existingSport.schema_version,
          claude_model_version: sportData.claude_model_version || existingSport.claude_model_version,
          last_updated: knex.fn.now()
        });
      
      return {
        ...existingSport,
        schema_version: sportData.schema_version || existingSport.schema_version,
        claude_model_version: sportData.claude_model_version || existingSport.claude_model_version,
        last_updated: new Date()
      };
    } else {
      // Insert new sport
      const [newSport] = await knex('sport_metadata')
        .insert({
          sport_name: sportData.sport_name,
          schema_version: sportData.schema_version || '1.0.0',
          claude_model_version: sportData.claude_model_version || 'claude-3-opus',
          last_updated: knex.fn.now()
        })
        .returning('*');
      
      return newSport;
    }
  } catch (error) {
    logger.error('Error registering sport', { error, sportData });
    throw error;
  }
};

/**
 * Register a basketball game in the resources table
 * @param {Object} gameData - Game data to register
 * @returns {Promise<Object>} - Registered game data
 */
exports.registerBasketballGame = async (gameData) => {
  try {
    // Generate UUID if not provided
    const gameId = gameData.game_id || uuidv4();
    
    // Insert game resource
    const [newGame] = await knex('basketball_resources')
      .insert({
        game_id: gameId,
        team_a: gameData.team_a,
        team_b: gameData.team_b,
        net_impact: gameData.net_impact,
        travel_miles: gameData.travel_miles,
        tv_slot: gameData.tv_slot,
        sport_id: gameData.sport_id,
        matchup_id: gameData.matchup_id
      })
      .returning('*');
    
    return newGame;
  } catch (error) {
    logger.error('Error registering basketball game', { error, gameData });
    throw error;
  }
};

/**
 * Register an agent in the registry
 * @param {Object} agentData - Agent data to register
 * @returns {Promise<Object>} - Registered agent data
 */
exports.registerAgent = async (agentData) => {
  try {
    console.log('Mock registerAgent called with data:', agentData);
    // Return a mock agent
    return {
      agent_id: agentData.agent_id || uuidv4(),
      sport_id: agentData.sport_id,
      capabilities: agentData.capabilities,
      agent_type: agentData.agent_type,
      is_active: true,
      last_ping: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
  } catch (error) {
    logger.error('Error registering agent', { error, agentData });
    throw error;
  }
};

/**
 * Update agent ping time
 * @param {string} agentId - Agent ID to update
 * @returns {Promise<Object>} - Updated agent data
 */
exports.updateAgentPing = async (agentId) => {
  try {
    const [updatedAgent] = await knex('agent_registry')
      .where({ agent_id: agentId })
      .update({
        last_ping: knex.fn.now(),
        updated_at: knex.fn.now()
      })
      .returning('*');
    
    return updatedAgent;
  } catch (error) {
    logger.error('Error updating agent ping', { error, agentId });
    throw error;
  }
};

/**
 * Get all sports
 * @returns {Promise<Array>} - List of sports
 */
exports.getSports = async () => {
  try {
    console.log('Mock getSports called');
    return [{
      sport_id: 1,
      sport_name: 'basketball',
      schema_version: '1.0.0',
      last_updated: new Date(),
      claude_model_version: 'claude-3-opus'
    }];
  } catch (error) {
    logger.error('Error getting sports', { error });
    throw error;
  }
};

/**
 * Get basketball games
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - List of basketball games
 */
exports.getBasketballGames = async (filters = {}) => {
  try {
    const query = knex('basketball_resources')
      .select('*')
      .orderBy('tv_slot', 'asc');
    
    // Apply filters if provided
    if (filters.team) {
      query.where(function() {
        this.where('team_a', filters.team)
          .orWhere('team_b', filters.team);
      });
    }
    
    if (filters.sport_id) {
      query.where('sport_id', filters.sport_id);
    }
    
    return await query;
  } catch (error) {
    logger.error('Error getting basketball games', { error, filters });
    throw error;
  }
};

/**
 * Get registered agents
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - List of agents
 */
exports.getAgents = async (filters = {}) => {
  try {
    console.log('Mock getAgents called with filters:', filters);
    return [{
      agent_id: '123e4567-e89b-12d3-a456-426614174000',
      sport_id: 1,
      agent_type: 'scheduling',
      capabilities: '{"clustering":true,"scheduling":true,"optimization":true,"analysis":true}',
      is_active: true,
      last_ping: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }];
  } catch (error) {
    logger.error('Error getting agents', { error, filters });
    throw error;
  }
}; 