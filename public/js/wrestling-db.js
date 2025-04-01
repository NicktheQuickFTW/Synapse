/**
 * Wrestling Database API Utilities
 * 
 * Functions to interact with the XII-OS cloud database for the FlexTime Wrestling application
 */

const WrestlingDB = (function() {
  
  // API endpoint base URL - adjust based on your server configuration
  const API_BASE_URL = '/api/wrestling';
  
  /**
   * Fetch all wrestling teams
   * @returns {Promise<Array>} Promise resolving to array of team objects
   */
  async function getTeams() {
    try {
      const response = await fetch(`${API_BASE_URL}/teams`);
      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  }
  
  /**
   * Fetch a team by ID
   * @param {number} teamId - The team ID
   * @returns {Promise<Object>} Promise resolving to team object
   */
  async function getTeamById(teamId) {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch team: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching team ${teamId}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch all rivalries
   * @returns {Promise<Array>} Promise resolving to array of rivalry objects
   */
  async function getRivalries() {
    try {
      const response = await fetch(`${API_BASE_URL}/rivalries`);
      if (!response.ok) {
        throw new Error(`Failed to fetch rivalries: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching rivalries:', error);
      return [];
    }
  }
  
  /**
   * Fetch all COMPASS data
   * @returns {Promise<Array>} Promise resolving to array of COMPASS data objects
   */
  async function getCompassData() {
    try {
      const response = await fetch(`${API_BASE_URL}/compass`);
      if (!response.ok) {
        throw new Error(`Failed to fetch COMPASS data: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching COMPASS data:', error);
      return [];
    }
  }
  
  /**
   * Fetch COMPASS data for a specific team
   * @param {number} teamId - The team ID
   * @returns {Promise<Object>} Promise resolving to COMPASS data object
   */
  async function getTeamCompassData(teamId) {
    try {
      const response = await fetch(`${API_BASE_URL}/compass/team/${teamId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch team COMPASS data: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching COMPASS data for team ${teamId}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch all schedules
   * @returns {Promise<Array>} Promise resolving to array of schedule objects
   */
  async function getSchedules() {
    try {
      const response = await fetch(`${API_BASE_URL}/schedules`);
      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching schedules:', error);
      return [];
    }
  }
  
  /**
   * Fetch a specific schedule by ID
   * @param {number} scheduleId - The schedule ID
   * @returns {Promise<Object>} Promise resolving to schedule object
   */
  async function getScheduleById(scheduleId) {
    try {
      const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch schedule: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching schedule ${scheduleId}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch meets for a specific schedule
   * @param {number} scheduleId - The schedule ID
   * @returns {Promise<Array>} Promise resolving to array of meet objects
   */
  async function getMeetsByScheduleId(scheduleId) {
    try {
      const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/meets`);
      if (!response.ok) {
        throw new Error(`Failed to fetch meets: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching meets for schedule ${scheduleId}:`, error);
      return [];
    }
  }
  
  /**
   * Create a new schedule
   * @param {Object} scheduleData - The schedule data to create
   * @returns {Promise<Object>} Promise resolving to created schedule object
   */
  async function createSchedule(scheduleData) {
    try {
      const response = await fetch(`${API_BASE_URL}/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create schedule: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing schedule
   * @param {number} scheduleId - The schedule ID to update
   * @param {Object} scheduleData - The updated schedule data
   * @returns {Promise<Object>} Promise resolving to updated schedule object
   */
  async function updateSchedule(scheduleId, scheduleData) {
    try {
      const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update schedule: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating schedule ${scheduleId}:`, error);
      throw error;
    }
  }
  
  /**
   * Generate a schedule with AI optimization
   * @param {Object} parameters - The schedule generation parameters
   * @returns {Promise<Object>} Promise resolving to generated schedule object
   */
  async function generateSchedule(parameters) {
    try {
      const response = await fetch(`${API_BASE_URL}/schedules/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parameters)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate schedule: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  }
  
  /**
   * Save schedule constraints
   * @param {Object} constraintData - The constraint data to save
   * @returns {Promise<Object>} Promise resolving to created constraint object
   */
  async function saveConstraint(constraintData) {
    try {
      const response = await fetch(`${API_BASE_URL}/constraints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(constraintData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save constraint: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving constraint:', error);
      throw error;
    }
  }
  
  /**
   * Get all constraints
   * @returns {Promise<Array>} Promise resolving to array of constraint objects
   */
  async function getConstraints() {
    try {
      const response = await fetch(`${API_BASE_URL}/constraints`);
      if (!response.ok) {
        throw new Error(`Failed to fetch constraints: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching constraints:', error);
      return [];
    }
  }
  
  /**
   * Delete a constraint
   * @param {number} constraintId - The constraint ID to delete
   * @returns {Promise<Object>} Promise resolving to success/failure message
   */
  async function deleteConstraint(constraintId) {
    try {
      const response = await fetch(`${API_BASE_URL}/constraints/${constraintId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete constraint: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error deleting constraint ${constraintId}:`, error);
      throw error;
    }
  }
  
  /**
   * Handle API errors with a custom callback
   * @param {Error} error - The error object
   * @param {Function} callback - Custom error handling callback
   */
  function handleApiError(error, callback) {
    console.error('API Error:', error);
    if (typeof callback === 'function') {
      callback(error);
    }
  }
  
  // Return public API
  return {
    getTeams,
    getTeamById,
    getRivalries,
    getCompassData,
    getTeamCompassData,
    getSchedules,
    getScheduleById,
    getMeetsByScheduleId,
    createSchedule,
    updateSchedule,
    generateSchedule,
    saveConstraint,
    getConstraints,
    deleteConstraint,
    handleApiError
  };
})();

// Export for CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WrestlingDB;
} 