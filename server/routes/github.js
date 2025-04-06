const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');

/**
 * @route   GET /api/github/projects
 * @desc    Get all GitHub projects
 * @access  Public
 */
router.get('/projects', githubController.getAllProjects);

/**
 * @route   GET /api/github/projects/:id
 * @desc    Get a GitHub project by ID
 * @access  Public
 */
router.get('/projects/:id', githubController.getProjectById);

/**
 * @route   POST /api/github/projects
 * @desc    Create a new GitHub project
 * @access  Public
 */
router.post('/projects', githubController.createProject);

/**
 * @route   PUT /api/github/projects/:id
 * @desc    Update a GitHub project
 * @access  Public
 */
router.put('/projects/:id', githubController.updateProject);

/**
 * @route   DELETE /api/github/projects/:id
 * @desc    Delete a GitHub project
 * @access  Public
 */
router.delete('/projects/:id', githubController.deleteProject);

/**
 * @route   POST /api/github/repositories
 * @desc    Add a GitHub repository to a project
 * @access  Public
 */
router.post('/repositories', githubController.addRepository);

/**
 * @route   GET /api/github/projects/:project_id/repositories
 * @desc    Get repositories for a project
 * @access  Public
 */
router.get('/projects/:project_id/repositories', githubController.getRepositories);

/**
 * @route   POST /api/github/clone
 * @desc    Clone a GitHub repository
 * @access  Public
 */
router.post('/clone', githubController.cloneRepository);

/**
 * @route   GET /api/github/search
 * @desc    Search GitHub repositories
 * @access  Public
 */
router.get('/search', githubController.searchRepositories);

/**
 * @route   GET /api/github/cloned
 * @desc    List all cloned repositories
 * @access  Public
 */
router.get('/cloned', githubController.listClonedRepositories);

/**
 * @route   GET /api/github/cloned/:repo_name
 * @desc    Get information about a cloned repository
 * @access  Public
 */
router.get('/cloned/:repo_name', githubController.getRepositoryInfo);

/**
 * @route   DELETE /api/github/cloned/:repo_name
 * @desc    Delete a cloned repository
 * @access  Public
 */
router.delete('/cloned/:repo_name', githubController.deleteClonedRepository);

module.exports = router; 