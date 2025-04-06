const { Octokit } = require('octokit');
const GithubModel = require('../models/github');
const GitHubService = require('../services/githubService');

// Initialize Octokit with the GitHub token from environment variables
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const GithubController = {
  /**
   * Get all GitHub projects
   */
  getAllProjects: async (req, res) => {
    try {
      const projects = await GithubModel.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error('Error fetching GitHub projects:', error);
      res.status(500).json({ error: 'Failed to fetch GitHub projects' });
    }
  },

  /**
   * Get a GitHub project by ID
   */
  getProjectById: async (req, res) => {
    try {
      const project = await GithubModel.getProjectById(req.params.id);
      
      if (!project) {
        return res.status(404).json({ error: 'GitHub project not found' });
      }
      
      res.json(project);
    } catch (error) {
      console.error('Error fetching GitHub project:', error);
      res.status(500).json({ error: 'Failed to fetch GitHub project' });
    }
  },

  /**
   * Create a new GitHub project
   */
  createProject: async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
      }
      
      const [id] = await GithubModel.addProject({
        name,
        description,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      res.status(201).json({ id, name, description });
    } catch (error) {
      console.error('Error creating GitHub project:', error);
      res.status(500).json({ error: 'Failed to create GitHub project' });
    }
  },

  /**
   * Update a GitHub project
   */
  updateProject: async (req, res) => {
    try {
      const { name, description } = req.body;
      const { id } = req.params;
      
      const project = await GithubModel.getProjectById(id);
      
      if (!project) {
        return res.status(404).json({ error: 'GitHub project not found' });
      }
      
      await GithubModel.updateProject(id, {
        name: name || project.name,
        description: description || project.description,
        updated_at: new Date()
      });
      
      res.json({ message: 'GitHub project updated successfully' });
    } catch (error) {
      console.error('Error updating GitHub project:', error);
      res.status(500).json({ error: 'Failed to update GitHub project' });
    }
  },

  /**
   * Delete a GitHub project
   */
  deleteProject: async (req, res) => {
    try {
      const { id } = req.params;
      
      const project = await GithubModel.getProjectById(id);
      
      if (!project) {
        return res.status(404).json({ error: 'GitHub project not found' });
      }
      
      await GithubModel.deleteProject(id);
      
      res.json({ message: 'GitHub project deleted successfully' });
    } catch (error) {
      console.error('Error deleting GitHub project:', error);
      res.status(500).json({ error: 'Failed to delete GitHub project' });
    }
  },

  /**
   * Add a GitHub repository to a project
   */
  addRepository: async (req, res) => {
    try {
      const { project_id, repo_url } = req.body;
      
      if (!project_id || !repo_url) {
        return res.status(400).json({ error: 'Project ID and repository URL are required' });
      }
      
      // Extract owner and repo from GitHub URL
      const repoUrlMatch = repo_url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      
      if (!repoUrlMatch) {
        return res.status(400).json({ error: 'Invalid GitHub repository URL' });
      }
      
      const [, owner, repo] = repoUrlMatch;
      
      // Fetch repository details from GitHub API
      const { data } = await octokit.rest.repos.get({ owner, repo });
      
      const [id] = await GithubModel.addRepository({
        project_id,
        repo_url,
        owner,
        repo_name: repo,
        description: data.description,
        stars: data.stargazers_count,
        language: data.language,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      res.status(201).json({ 
        id, 
        project_id, 
        repo_url, 
        owner, 
        repo_name: repo,
        description: data.description,
        stars: data.stargazers_count,
        language: data.language
      });
    } catch (error) {
      console.error('Error adding GitHub repository:', error);
      res.status(500).json({ error: 'Failed to add GitHub repository' });
    }
  },

  /**
   * Get repositories for a project
   */
  getRepositories: async (req, res) => {
    try {
      const { project_id } = req.params;
      
      const repositories = await GithubModel.getRepositoriesByProject(project_id);
      
      res.json(repositories);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      res.status(500).json({ error: 'Failed to fetch repositories' });
    }
  },

  /**
   * Clone a GitHub repository
   */
  cloneRepository: async (req, res) => {
    try {
      const { repo_url, target_directory } = req.body;
      
      if (!repo_url) {
        return res.status(400).json({ error: 'Repository URL is required' });
      }
      
      // Use the GitHub service to clone the repository
      const result = await GitHubService.cloneRepository(repo_url, target_directory);
      
      res.json({
        message: 'Repository cloned successfully',
        stdout: result.stdout,
        stderr: result.stderr,
        repo_url,
        target_directory: target_directory || 'default'
      });
    } catch (error) {
      console.error('Error cloning repository:', error);
      res.status(500).json({ error: 'Failed to clone repository: ' + error.message });
    }
  },

  /**
   * Search GitHub repositories
   */
  searchRepositories: async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const { data } = await octokit.rest.search.repos({
        q,
        sort: 'stars',
        order: 'desc',
        per_page: 10
      });
      
      const repositories = data.items.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        url: repo.html_url,
        description: repo.description,
        stars: repo.stargazers_count,
        language: repo.language,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url
        }
      }));
      
      res.json(repositories);
    } catch (error) {
      console.error('Error searching repositories:', error);
      res.status(500).json({ error: 'Failed to search repositories' });
    }
  },

  /**
   * List all cloned repositories
   */
  listClonedRepositories: async (req, res) => {
    try {
      const repositories = await GitHubService.listRepositories();
      res.json(repositories);
    } catch (error) {
      console.error('Error listing cloned repositories:', error);
      res.status(500).json({ error: 'Failed to list cloned repositories: ' + error.message });
    }
  },

  /**
   * Delete a cloned repository
   */
  deleteClonedRepository: async (req, res) => {
    try {
      const { repo_name } = req.params;
      
      if (!repo_name) {
        return res.status(400).json({ error: 'Repository name is required' });
      }
      
      await GitHubService.deleteRepository(repo_name);
      
      res.json({ message: 'Repository deleted successfully' });
    } catch (error) {
      console.error('Error deleting cloned repository:', error);
      res.status(500).json({ error: 'Failed to delete cloned repository: ' + error.message });
    }
  },

  /**
   * Get repository information
   */
  getRepositoryInfo: async (req, res) => {
    try {
      const { repo_name } = req.params;
      
      if (!repo_name) {
        return res.status(400).json({ error: 'Repository name is required' });
      }
      
      const info = await GitHubService.getRepositoryInfo(repo_name);
      
      res.json(info);
    } catch (error) {
      console.error('Error getting repository info:', error);
      res.status(500).json({ error: 'Failed to get repository info: ' + error.message });
    }
  }
};

module.exports = GithubController; 