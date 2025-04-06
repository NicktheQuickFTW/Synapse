/**
 * FlexTime Configuration
 * 
 * Configuration settings for the FlexTime module.
 */

const path = require('path');
const os = require('os');

// Determine project root directory
const projectRoot = path.resolve(__dirname, '../../..');

module.exports = {
  // File paths for scheduling data
  schedulingDataPaths: {
    corePath: path.join(projectRoot, 'data', 'scheduling', 'core'),
    sportsPaths: {
      'basketball': path.join(projectRoot, 'data', 'scheduling', 'basketball'),
      'football': path.join(projectRoot, 'data', 'scheduling', 'football'),
      'baseball': path.join(projectRoot, 'data', 'scheduling', 'baseball'),
      'softball': path.join(projectRoot, 'data', 'scheduling', 'softball'),
      'volleyball': path.join(projectRoot, 'data', 'scheduling', 'volleyball'),
      'soccer': path.join(projectRoot, 'data', 'scheduling', 'soccer'),
      'wrestling': path.join(projectRoot, 'data', 'scheduling', 'wrestling'),
      'tennis': path.join(projectRoot, 'data', 'scheduling', 'tennis'),
      'lacrosse': path.join(projectRoot, 'data', 'scheduling', 'lacrosse'),
      'gymnastics': path.join(projectRoot, 'data', 'scheduling', 'gymnastics')
    }
  },
  
  // Branding data paths
  brandingDataPath: path.join(projectRoot, 'data', 'school_branding'),
  
  // Output paths
  outputPaths: {
    schedules: path.join(projectRoot, 'data', 'output', 'schedules'),
    reports: path.join(projectRoot, 'data', 'output', 'reports'),
    visualizations: path.join(projectRoot, 'data', 'output', 'visualizations')
  },
  
  // Storage configuration
  storage: {
    type: 'file', // 'file', 'database', etc.
    basePath: path.join(projectRoot, 'data', 'storage')
  },
  
  // Agent configuration
  agents: {
    // Paths to agent directories
    singleFileAgentsPath: path.join(projectRoot, 'single-file-agents'),
    flextimeAgentsPath: path.join(projectRoot, 'modules', 'flextime', 'agents'),
    
    // DuckDB agent configuration
    duckdb: {
      scriptPath: 'duckdb.py',
      flexTimeScriptPath: 'flextime-duckdb.py',
      databasePath: path.join(projectRoot, 'xii-os.duckdb')
    },
    
    // Polars agent configuration
    polars: {
      scriptPath: 'polars.py',
      flexTimeScriptPath: 'flextime-polars.py'
    },
    
    // JQ agent configuration
    jq: {
      scriptPath: 'jq.py',
      flexTimeScriptPath: 'flextime-jq.py'
    },
    
    // Bash agent configuration
    bash: {
      scriptPath: 'bash.py',
      flexTimeScriptPath: 'flextime-bash.py'
    },
    
    // Scraper agent configuration
    scraper: {
      scriptPath: 'scraper.py',
      flexTimeScriptPath: 'flextime-scraper.py'
    },
    
    // Codebase agent configuration
    codebase: {
      scriptPath: 'codebase.py',
      flexTimeScriptPath: 'flextime-codebase.py'
    },
    
    // COMPASS Integration agent configuration
    compassIntegration: {
      flexTimeScriptPath: 'flextime-compass.py'
    },
    
    // Head Coach agent configuration
    headCoach: {
      flexTimeScriptPath: 'flextime-head-coach.py'
    }
  },
  
  // Tool configuration
  tools: {
    binaries: {
      duckdb: 'duckdb',
      jq: 'jq'
    }
  },
  
  // API configurations
  apis: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY
    },
    weather: {
      provider: 'openweathermap',
      apiKey: process.env.OPENWEATHERMAP_API_KEY
    }
  },
  
  // Scheduling constraints
  constraints: {
    byuNoSunday: true,
    examPeriodBlackout: true,
    maxBackToBackGames: 2,
    minRestDaysBetweenGames: 1,
    maxConsecutiveRoadGames: 3,
    maxConsecutiveHomeGames: 4
  }
}; 