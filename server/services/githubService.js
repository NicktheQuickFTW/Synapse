const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');

// Convert exec to Promise-based
const execPromise = util.promisify(exec);

class GitHubService {
  /**
   * Clone a GitHub repository
   * 
   * @param {string} repoUrl - GitHub repository URL
   * @param {string} targetDir - Target directory to clone into
   * @returns {Promise<object>} Result object with stdout and stderr
   */
  static async cloneRepository(repoUrl, targetDir = 'default') {
    try {
      // Sanitize repository URL
      if (!repoUrl.match(/^https:\/\/github\.com\/[^\/]+\/[^\/]+/)) {
        throw new Error('Invalid GitHub repository URL');
      }

      // Create base directory for repositories if it doesn't exist
      const baseDir = path.join(process.cwd(), 'repositories');
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }

      // Convert targetDir to safe directory name
      const safeDirName = targetDir === 'default' 
        ? repoUrl.split('/').pop().replace('.git', '') 
        : targetDir.replace(/[^a-zA-Z0-9-_]/g, '_');
      
      const fullPath = path.join(baseDir, safeDirName);

      // Check if directory already exists
      if (fs.existsSync(fullPath)) {
        // If it exists, just pull the latest changes
        console.log(`Repository already exists at ${fullPath}, pulling latest changes...`);
        return await execPromise(`cd ${fullPath} && git pull`);
      }

      // Clone the repository
      console.log(`Cloning repository ${repoUrl} to ${fullPath}...`);
      return await execPromise(`git clone ${repoUrl} ${fullPath}`);
    } catch (error) {
      console.error('Error cloning repository:', error);
      throw error;
    }
  }

  /**
   * Get repository information
   * 
   * @param {string} repoPath - Path to the repository
   * @returns {Promise<object>} Repository information
   */
  static async getRepositoryInfo(repoPath) {
    try {
      const fullPath = path.join(process.cwd(), 'repositories', repoPath);
      
      // Check if repository exists
      if (!fs.existsSync(fullPath)) {
        throw new Error('Repository does not exist');
      }

      // Get last commit date
      const { stdout: lastCommitDate } = await execPromise(
        `cd ${fullPath} && git log -1 --format=%cd`
      );

      // Get commit count
      const { stdout: commitCount } = await execPromise(
        `cd ${fullPath} && git rev-list --count HEAD`
      );

      // Get branch count
      const { stdout: branchOutput } = await execPromise(
        `cd ${fullPath} && git branch -a | wc -l`
      );
      const branchCount = parseInt(branchOutput.trim());

      // Get repository size
      const { stdout: sizeOutput } = await execPromise(
        `du -sh ${fullPath} | cut -f1`
      );
      const size = sizeOutput.trim();

      return {
        path: fullPath,
        lastCommitDate: lastCommitDate.trim(),
        commitCount: parseInt(commitCount.trim()),
        branchCount,
        size
      };
    } catch (error) {
      console.error('Error getting repository info:', error);
      throw error;
    }
  }

  /**
   * List all cloned repositories
   * 
   * @returns {Promise<array>} Array of repository directories
   */
  static async listRepositories() {
    try {
      const baseDir = path.join(process.cwd(), 'repositories');
      
      // Check if base directory exists
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
        return [];
      }

      // Get all directories in the repositories folder
      const directories = fs.readdirSync(baseDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      // Get more information about each repository
      const repositories = [];
      for (const dir of directories) {
        try {
          const repoInfo = await this.getRepositoryInfo(dir);
          repositories.push({
            name: dir,
            ...repoInfo
          });
        } catch (error) {
          console.error(`Error getting info for repository ${dir}:`, error);
          // Add with basic info if we can't get detailed info
          repositories.push({
            name: dir,
            path: path.join(baseDir, dir),
            error: error.message
          });
        }
      }

      return repositories;
    } catch (error) {
      console.error('Error listing repositories:', error);
      throw error;
    }
  }

  /**
   * Delete a cloned repository
   * 
   * @param {string} repoName - Repository name/directory
   * @returns {Promise<boolean>} Success status
   */
  static async deleteRepository(repoName) {
    try {
      const baseDir = path.join(process.cwd(), 'repositories');
      const repoPath = path.join(baseDir, repoName);

      // Check if repository exists
      if (!fs.existsSync(repoPath)) {
        throw new Error('Repository does not exist');
      }

      // Remove the repository directory
      const { stdout, stderr } = await execPromise(`rm -rf ${repoPath}`);

      if (stderr) {
        console.error('Error removing repository:', stderr);
        throw new Error(stderr);
      }

      return true;
    } catch (error) {
      console.error('Error deleting repository:', error);
      throw error;
    }
  }
}

module.exports = GitHubService; 