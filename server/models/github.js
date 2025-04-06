const knex = require('knex');
const config = require('../../knexfile');

// Initialize knex with the configuration
const db = knex(config.development);

const GithubModel = {
  /**
   * Get all GitHub projects
   * @returns {Promise<Array>} Array of GitHub projects
   */
  getAllProjects: async () => {
    return db('github_projects').select('*');
  },

  /**
   * Get a GitHub project by ID
   * @param {number} id - Project ID
   * @returns {Promise<Object>} GitHub project
   */
  getProjectById: async (id) => {
    return db('github_projects').where({ id }).first();
  },

  /**
   * Add a new GitHub project
   * @param {Object} project - GitHub project object
   * @returns {Promise<Array>} Array with the inserted ID
   */
  addProject: async (project) => {
    return db('github_projects').insert(project).returning('id');
  },

  /**
   * Update a GitHub project
   * @param {number} id - Project ID
   * @param {Object} project - Updated GitHub project data
   * @returns {Promise<number>} Number of updated rows
   */
  updateProject: async (id, project) => {
    return db('github_projects').where({ id }).update(project);
  },

  /**
   * Delete a GitHub project
   * @param {number} id - Project ID
   * @returns {Promise<number>} Number of deleted rows
   */
  deleteProject: async (id) => {
    return db('github_projects').where({ id }).delete();
  },

  /**
   * Add a repository to a project
   * @param {Object} repo - Repository data
   * @returns {Promise<Array>} Array with the inserted ID
   */
  addRepository: async (repo) => {
    return db('github_repositories').insert(repo).returning('id');
  },

  /**
   * Get repositories by project ID
   * @param {number} projectId - Project ID
   * @returns {Promise<Array>} Array of repositories
   */
  getRepositoriesByProject: async (projectId) => {
    return db('github_repositories').where({ project_id: projectId }).select('*');
  }
};

module.exports = GithubModel; 