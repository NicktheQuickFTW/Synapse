/**
 * FlexTime Module
 * 
 * This module provides access to scheduling data and offers functionality
 * for storing, updating, and analyzing scheduling information.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const config = require('../config/config');
const prompts = require('./prompts');
const compassIntegration = require('./compass-integration');
const agentUtils = require('./agent-utils');
const utils = require('./utils');
const os = require('os');

/**
 * Generate school-specific context to add to agent prompts
 * 
 * @returns {string} School context information
 */
function generateSchoolContext() {
  try {
    const schoolInfoPath = path.join(config.brandingDataPath, 'school_info.json');
    if (fs.existsSync(schoolInfoPath)) {
      const schoolData = JSON.parse(fs.readFileSync(schoolInfoPath, 'utf8'));
      let context = "Current Big 12 schools with their primary colors:\n";
      
      Object.keys(schoolData).forEach(schoolKey => {
        const school = schoolData[schoolKey];
        context += `- ${school.name}: ${school.primary_color || 'Unknown'}\n`;
      });
      
      return context;
    }
    return "";
  } catch (e) {
    console.error("Error generating school context:", e.message);
    return "";
  }
}

/**
 * Initialize all integrations
 */
async function initializeIntegrations() {
  try {
    // Initialize COMPASS integration
    await compassIntegration.initialize();
    
    // Initialize the FlexTime specialized agents
    console.log("Initializing FlexTime specialized agents...");
    const agentInitResults = await flextime.agents.initializeFlexTimeAgents();
    console.log("Agent initialization results:", agentInitResults);
  } catch (error) {
    console.error(`Error initializing integrations: ${error.message}`);
  }
}

// Initialize integrations on module load
initializeIntegrations();

/**
 * FlexTime module
 */
const flextime = {
  /**
   * Gets scheduling data for a specific sport
   * 
   * @param {string} sport - Sport name (e.g., 'basketball', 'soccer')
   * @returns {Object} Scheduling data for the specified sport
   */
  getSchedules(sport) {
    if (!sport || !config.schedulingDataPaths.sportsPaths[sport]) {
      throw new Error(`Invalid sport: ${sport}`);
    }
    
    const sportPath = config.schedulingDataPaths.sportsPaths[sport];
    // This is a placeholder for actual implementation
    // In real implementation, this would parse files based on their format
    return {
      sport,
      path: sportPath,
      // Mock data for demonstration
      files: fs.readdirSync(path.resolve(__dirname, sportPath))
    };
  },
  
  /**
   * Gets core scheduling data
   * 
   * @returns {Object} Core scheduling data
   */
  getCoreSchedulingData() {
    const corePath = config.schedulingDataPaths.corePath;
    // This is a placeholder for actual implementation
    return {
      path: corePath,
      // Mock data for demonstration
      files: fs.readdirSync(path.resolve(__dirname, corePath))
    };
  },
  
  /**
   * Detects conflicts in a proposed schedule
   * 
   * @param {Object} schedule - Proposed schedule
   * @returns {Array} List of conflicts detected
   */
  detectConflicts(schedule) {
    // This is a placeholder for actual implementation
    // In real implementation, this would check against existing schedules
    return [];
  },
  
  /**
   * Stores a modified schedule
   * 
   * @param {Object} schedule - Modified schedule to store
   * @returns {boolean} Success status
   */
  storeSchedule(schedule) {
    if (!schedule) {
      throw new Error('Invalid schedule data');
    }
    
    // This is a placeholder for actual implementation
    // In real implementation, this would store data based on config.storage.type
    return true;
  },
  
  /**
   * Retrieves school branding information
   * 
   * @param {string} schoolCode - School identifier (e.g., 'arizona', 'baylor')
   * @returns {Object} School branding data
   */
  getSchoolBranding(schoolCode) {
    const brandingPath = config.brandingDataPath;
    try {
      const schoolInfoPath = path.join(brandingPath, 'school_info.json');
      if (fs.existsSync(schoolInfoPath)) {
        const schoolData = JSON.parse(fs.readFileSync(schoolInfoPath, 'utf8'));
        
        if (schoolData[schoolCode]) {
          return schoolData[schoolCode];
        } else {
          throw new Error(`School code '${schoolCode}' not found`);
        }
      }
      throw new Error('School branding data not found');
    } catch (error) {
      console.error(`Error retrieving school branding: ${error.message}`);
      // Fallback to mock data
      return {
        schoolCode,
        name: `${schoolCode.charAt(0).toUpperCase() + schoolCode.slice(1)} University`,
        logo: `${schoolCode}_logo.svg`,
        primaryColor: '#000000',
        secondaryColor: '#FFFFFF'
      };
    }
  },
  
  /**
   * Agent access methods
   */
  agents: {
    /**
     * Run the DuckDB agent to query the XII-OS database with XII-OS specific context
     * 
     * @param {string} prompt - Natural language query for the agent
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Result from the agent
     */
    async runDuckDbAgent(prompt, options = {}) {
      const agentConfig = config.agents.duckdb;
      const dbPath = options.dbPath || agentConfig.databasePath;
      const scriptPath = path.join(
        config.agents.singleFileAgentsPath,
        agentConfig.scriptPath
      );
      
      // Add XII-OS specific context to the prompt
      const schoolContext = generateSchoolContext();
      const enhancedPrompt = `${prompts.duckdb.queryPrefix}${prompt}\n\n${schoolContext}`;
      
      try {
        // Load environment variables from parent .env file
        const envCmd = 'export $(grep -v \'^#\' /Users/nickthequick/XII-OS/.env | xargs) && ';
        // Include system prompt for the agent if supported by the script
        const systemPromptArg = options.useSystemPrompt ? `--system-prompt "${prompts.duckdb.systemPrompt}"` : '';
        const command = `${envCmd}cd ${config.agents.singleFileAgentsPath} && uv run ${agentConfig.scriptPath} -d ${dbPath} -p "${enhancedPrompt}" ${systemPromptArg}`;
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Installed') && !stderr.includes('Warning')) {
          console.error(`DuckDB Agent Error: ${stderr}`);
        }
        
        // Post-process the agent's output to enhance XII-OS relevance
        let output = stdout;
        
        // Add FlexTime-specific context to the response
        if (output && !options.rawOutput) {
          output = `[FlexTime Schedule Analysis]\n\n${output}`;
        }
        
        return output;
      } catch (error) {
        console.error(`Error running DuckDB agent: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Run the Polars CSV agent to analyze CSV data with XII-OS specific context
     * 
     * @param {string} inputFile - Path to the CSV file
     * @param {string} prompt - Natural language query for the agent
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Result from the agent
     */
    async runPolarsAgent(inputFile, prompt, options = {}) {
      const agentConfig = config.agents.polars;
      const scriptPath = path.join(
        config.agents.singleFileAgentsPath,
        agentConfig.scriptPath
      );
      
      // Add XII-OS specific context to the prompt
      const enhancedPrompt = `${prompts.polars.queryPrefix}${prompt}`;
      
      try {
        // Load environment variables from parent .env file
        const envCmd = 'export $(grep -v \'^#\' /Users/nickthequick/XII-OS/.env | xargs) && ';
        const command = `${envCmd}cd ${config.agents.singleFileAgentsPath} && uv run ${agentConfig.scriptPath} -i "${inputFile}" -p "${enhancedPrompt}"`;
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Installed') && !stderr.includes('Warning')) {
          console.error(`Polars Agent Error: ${stderr}`);
        }
        
        // Post-process to enhance for FlexTime
        return stdout;
      } catch (error) {
        console.error(`Error running Polars agent: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Run the JQ agent to process JSON data with XII-OS specific context
     * 
     * @param {string} prompt - Natural language description of JSON transformation
     * @param {boolean} execute - Whether to execute the command or just return it
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Result from the agent
     */
    async runJqAgent(prompt, execute = true, options = {}) {
      const agentConfig = config.agents.jq;
      const scriptPath = path.join(
        config.agents.singleFileAgentsPath,
        agentConfig.scriptPath
      );
      
      // Add XII-OS specific context to the prompt
      const enhancedPrompt = `${prompts.jq.queryPrefix}${prompt}`;
      
      try {
        // Load environment variables from parent .env file
        const envCmd = 'export $(grep -v \'^#\' /Users/nickthequick/XII-OS/.env | xargs) && ';
        const exeFlag = execute ? '--exe' : '';
        const command = `${envCmd}cd ${config.agents.singleFileAgentsPath} && uv run ${agentConfig.scriptPath} ${exeFlag} "${enhancedPrompt}"`;
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Installed') && !stderr.includes('Warning')) {
          console.error(`JQ Agent Error: ${stderr}`);
        }
        
        return stdout;
      } catch (error) {
        console.error(`Error running JQ agent: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Run the Bash Editor agent with XII-OS specific context
     * 
     * @param {string} prompt - Natural language instruction for the agent
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Result from the agent
     */
    async runBashAgent(prompt, options = {}) {
      const agentConfig = config.agents.bash;
      const scriptPath = path.join(
        config.agents.singleFileAgentsPath,
        agentConfig.scriptPath
      );
      
      // Add XII-OS specific context to the prompt
      const enhancedPrompt = `${prompts.bash.queryPrefix}${prompt}`;
      
      try {
        // Load environment variables from parent .env file
        const envCmd = 'export $(grep -v \'^#\' /Users/nickthequick/XII-OS/.env | xargs) && ';
        const command = `${envCmd}cd ${config.agents.singleFileAgentsPath} && uv run ${agentConfig.scriptPath} --prompt "${enhancedPrompt}"`;
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Installed') && !stderr.includes('Warning')) {
          console.error(`Bash Agent Error: ${stderr}`);
        }
        
        return stdout;
      } catch (error) {
        console.error(`Error running Bash agent: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Run the Web Scraper agent with XII-OS specific context
     * 
     * @param {string} url - URL to scrape
     * @param {string} prompt - Natural language instruction for the agent
     * @param {string} outputPath - Path for output file
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Result from the agent
     */
    async runScraperAgent(url, prompt, outputPath, options = {}) {
      const agentConfig = config.agents.scraper;
      const scriptPath = path.join(
        config.agents.singleFileAgentsPath,
        agentConfig.scriptPath
      );
      
      // Add XII-OS specific context to the prompt
      const enhancedPrompt = `${prompts.scraper.queryPrefix}${prompt}`;
      
      try {
        // Load environment variables from parent .env file
        const envCmd = 'export $(grep -v \'^#\' /Users/nickthequick/XII-OS/.env | xargs) && ';
        const outputArg = outputPath ? `--output-file-path "${outputPath}"` : '';
        const command = `${envCmd}cd ${config.agents.singleFileAgentsPath} && uv run ${agentConfig.scriptPath} --url "${url}" --prompt "${enhancedPrompt}" ${outputArg}`;
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Installed') && !stderr.includes('Warning')) {
          console.error(`Scraper Agent Error: ${stderr}`);
        }
        
        return stdout;
      } catch (error) {
        console.error(`Error running Scraper agent: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Run the COMPASS Integration agent for geographic and travel optimization
     * 
     * @param {string} prompt - Natural language query for the agent
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Result from the agent
     */
    async runCompassIntegrationAgent(prompt, options = {}) {
      try {
        // First ensure the agent exists and is customized
        if (!fs.existsSync(path.join(
          config.agents.flextimeAgentsPath,
          config.agents.compassIntegration.flexTimeScriptPath
        ))) {
          console.log("COMPASS Integration agent doesn't exist yet, initializing all agents first");
          await this.initializeFlexTimeAgents();
        }
        
        const agentConfig = config.agents.compassIntegration;
        const scriptPath = path.join(
          config.agents.flextimeAgentsPath,
          agentConfig.flexTimeScriptPath
        );
        
        // Add XII-OS specific context to the prompt
        const enhancedPrompt = `${prompts.compassIntegration.queryPrefix}${prompt}`;
        
        // Load environment variables from parent .env file
        const envCmd = 'export $(grep -v \'^#\' /Users/nickthequick/XII-OS/.env | xargs) && ';
        
        // Include system prompt for the agent if supported by the script
        const systemPromptArg = options.useSystemPrompt ? `--system-prompt "${prompts.compassIntegration.systemPrompt}"` : '';
        
        const command = `${envCmd}cd ${config.agents.flextimeAgentsPath} && uv run ${agentConfig.flexTimeScriptPath} -p "${enhancedPrompt}" ${systemPromptArg}`;
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Installed') && !stderr.includes('Warning')) {
          console.error(`COMPASS Integration Agent Error: ${stderr}`);
        }
        
        // COMPASS Integration agent output is already formatted
        return stdout;
      } catch (error) {
        console.error(`Error running COMPASS Integration agent: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Run the FlexTime Head Coach agent - the manager agent that coordinates other specialist agents
     * 
     * @param {string} prompt - Natural language query for the Head Coach
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Result from the Head Coach
     */
    async runHeadCoachAgent(prompt, options = {}) {
      try {
        // First ensure the agent exists and is customized
        if (!fs.existsSync(path.join(
          config.agents.flextimeAgentsPath,
          config.agents.headCoach.flexTimeScriptPath
        ))) {
          console.log("Head Coach agent doesn't exist yet, initializing all agents first");
          await this.initializeFlexTimeAgents();
        }
        
        const agentConfig = config.agents.headCoach;
        const scriptPath = path.join(
          config.agents.flextimeAgentsPath,
          agentConfig.flexTimeScriptPath
        );
        
        // Add XII-OS specific context to the prompt
        const enhancedPrompt = `${prompts.headCoach.queryPrefix}${prompt}`;
        
        // Load environment variables from parent .env file
        const envCmd = 'export $(grep -v \'^#\' /Users/nickthequick/XII-OS/.env | xargs) && ';
        
        // Include system prompt for the agent if supported by the script
        const systemPromptArg = options.useSystemPrompt ? `--system-prompt "${prompts.headCoach.systemPrompt}"` : '';
        
        const command = `${envCmd}cd ${config.agents.flextimeAgentsPath} && uv run ${agentConfig.flexTimeScriptPath} -p "${enhancedPrompt}" ${systemPromptArg}`;
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Installed') && !stderr.includes('Warning')) {
          console.error(`Head Coach Agent Error: ${stderr}`);
        }
        
        // Head Coach output is already formatted
        return stdout;
      } catch (error) {
        console.error(`Error running Head Coach agent: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Initialize FlexTime-specific versions of all agents
     * 
     * @returns {Promise<Object>} Results of initialization
     */
    async initializeFlexTimeAgents() {
      try {
        return await agentUtils.initializeFlexTimeAgents();
      } catch (error) {
        console.error(`Error initializing FlexTime agents: ${error.message}`);
        return { error: error.message };
      }
    },
    
    /**
     * Run the FlexTime-specific DuckDB agent
     * 
     * @param {string} prompt - Natural language query for the agent
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Result from the agent
     */
    async runFlexTimeDuckDbAgent(prompt, options = {}) {
      try {
        // First ensure the agent exists and is customized
        await agentUtils.customizeAgent('duckdb');
        
        const agentConfig = config.agents.duckdb;
        const dbPath = options.dbPath || agentConfig.databasePath;
        const scriptPath = path.join(
          config.agents.flextimeAgentsPath,
          agentConfig.flexTimeScriptPath
        );
        
        // Add XII-OS specific context to the prompt
        const schoolContext = generateSchoolContext();
        const enhancedPrompt = `${prompts.duckdb.queryPrefix}${prompt}\n\n${schoolContext}`;
        
        // Load environment variables from parent .env file
        const envCmd = 'export $(grep -v \'^#\' /Users/nickthequick/XII-OS/.env | xargs) && ';
        
        // Include system prompt for the agent if supported by the script
        const systemPromptArg = options.useSystemPrompt ? `--system-prompt "${prompts.duckdb.systemPrompt}"` : '';
        
        const command = `${envCmd}cd ${config.agents.flextimeAgentsPath} && uv run ${agentConfig.flexTimeScriptPath} -d ${dbPath} -p "${enhancedPrompt}" ${systemPromptArg}`;
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Installed') && !stderr.includes('Warning')) {
          console.error(`FlexTime DuckDB Agent Error: ${stderr}`);
        }
        
        // Post-process the agent's output
        let output = stdout;
        
        // Add FlexTime-specific context to the response
        if (output && !options.rawOutput) {
          output = `[FlexTime Schedule Analysis]\n\n${output}`;
        }
        
        return output;
      } catch (error) {
        console.error(`Error running FlexTime DuckDB agent: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Run the FlexTime-specific Polars agent
     * 
     * @param {string} inputFile - Path to the CSV file
     * @param {string} prompt - Natural language query for the agent
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Result from the agent
     */
    async runFlexTimePolarsAgent(inputFile, prompt, options = {}) {
      try {
        // First ensure the agent exists and is customized
        await agentUtils.customizeAgent('polars');
        
        const agentConfig = config.agents.polars;
        const scriptPath = path.join(
          config.agents.flextimeAgentsPath,
          agentConfig.flexTimeScriptPath
        );
        
        // Add XII-OS specific context to the prompt
        const enhancedPrompt = `${prompts.polars.queryPrefix}${prompt}`;
        
        // Load environment variables from parent .env file
        const envCmd = 'export $(grep -v \'^#\' /Users/nickthequick/XII-OS/.env | xargs) && ';
        
        const command = `${envCmd}cd ${config.agents.flextimeAgentsPath} && uv run ${agentConfig.flexTimeScriptPath} -i "${inputFile}" -p "${enhancedPrompt}"`;
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Installed') && !stderr.includes('Warning')) {
          console.error(`FlexTime Polars Agent Error: ${stderr}`);
        }
        
        // Post-process the agent's output
        return stdout;
      } catch (error) {
        console.error(`Error running FlexTime Polars agent: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Run the FlexTime-specific JQ agent
     * 
     * @param {string} prompt - Natural language description of JSON transformation
     * @param {boolean} execute - Whether to execute the command or just return it
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Result from the agent
     */
    async runFlexTimeJqAgent(prompt, execute = true, options = {}) {
      try {
        // First ensure the agent exists and is customized
        await agentUtils.customizeAgent('jq');
        
        const agentConfig = config.agents.jq;
        const scriptPath = path.join(
          config.agents.flextimeAgentsPath,
          agentConfig.flexTimeScriptPath
        );
        
        // Add XII-OS specific context to the prompt
        const enhancedPrompt = `${prompts.jq.queryPrefix}${prompt}`;
        
        // Load environment variables from parent .env file
        const envCmd = 'export $(grep -v \'^#\' /Users/nickthequick/XII-OS/.env | xargs) && ';
        const exeFlag = execute ? '--exe' : '';
        
        const command = `${envCmd}cd ${config.agents.flextimeAgentsPath} && uv run ${agentConfig.flexTimeScriptPath} ${exeFlag} "${enhancedPrompt}"`;
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Installed') && !stderr.includes('Warning')) {
          console.error(`FlexTime JQ Agent Error: ${stderr}`);
        }
        
        return stdout;
      } catch (error) {
        console.error(`Error running FlexTime JQ agent: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Run the FlexTime-specific Bash agent
     * 
     * @param {string} prompt - Natural language instruction for the agent
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Result from the agent
     */
    async runFlexTimeBashAgent(prompt, options = {}) {
      try {
        // First ensure the agent exists and is customized
        await agentUtils.customizeAgent('bash');
        
        const agentConfig = config.agents.bash;
        const scriptPath = path.join(
          config.agents.flextimeAgentsPath,
          agentConfig.flexTimeScriptPath
        );
        
        // Add XII-OS specific context to the prompt
        const enhancedPrompt = `${prompts.bash.queryPrefix}${prompt}`;
        
        // Load environment variables from parent .env file
        const envCmd = 'export $(grep -v \'^#\' /Users/nickthequick/XII-OS/.env | xargs) && ';
        
        const command = `${envCmd}cd ${config.agents.flextimeAgentsPath} && uv run ${agentConfig.flexTimeScriptPath} --prompt "${enhancedPrompt}"`;
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Installed') && !stderr.includes('Warning')) {
          console.error(`FlexTime Bash Agent Error: ${stderr}`);
        }
        
        return stdout;
      } catch (error) {
        console.error(`Error running FlexTime Bash agent: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Run the FlexTime-specific Web Scraper agent
     * 
     * @param {string} url - URL to scrape
     * @param {string} prompt - Natural language instruction for the agent
     * @param {string} outputPath - Path for output file
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Result from the agent
     */
    async runFlexTimeScraperAgent(url, prompt, outputPath, options = {}) {
      try {
        // First ensure the agent exists and is customized
        await agentUtils.customizeAgent('scraper');
        
        const agentConfig = config.agents.scraper;
        const scriptPath = path.join(
          config.agents.flextimeAgentsPath,
          agentConfig.flexTimeScriptPath
        );
        
        // Add XII-OS specific context to the prompt
        const enhancedPrompt = `${prompts.scraper.queryPrefix}${prompt}`;
        
        // Load environment variables from parent .env file
        const envCmd = 'export $(grep -v \'^#\' /Users/nickthequick/XII-OS/.env | xargs) && ';
        const outputArg = outputPath ? `--output-file-path "${outputPath}"` : '';
        
        const command = `${envCmd}cd ${config.agents.flextimeAgentsPath} && uv run ${agentConfig.flexTimeScriptPath} --url "${url}" --prompt "${enhancedPrompt}" ${outputArg}`;
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Installed') && !stderr.includes('Warning')) {
          console.error(`FlexTime Scraper Agent Error: ${stderr}`);
        }
        
        return stdout;
      } catch (error) {
        console.error(`Error running FlexTime Scraper agent: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Run the FlexTime-specific Codebase Context agent
     * 
     * @param {string} prompt - Natural language instruction for the agent
     * @param {string} codebasePath - Path to the codebase
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Result from the agent
     */
    async runFlexTimeCodebaseAgent(prompt, codebasePath, options = {}) {
      try {
        // First ensure the agent exists and is customized
        await agentUtils.customizeAgent('codebase');
        
        const agentConfig = config.agents.codebase;
        const scriptPath = path.join(
          config.agents.flextimeAgentsPath,
          agentConfig.flexTimeScriptPath
        );
        
        // Add XII-OS specific context to the prompt
        const enhancedPrompt = `${prompt}`; // No prefix for codebase
        
        // Load environment variables from parent .env file
        const envCmd = 'export $(grep -v \'^#\' /Users/nickthequick/XII-OS/.env | xargs) && ';
        
        const command = `${envCmd}cd ${config.agents.flextimeAgentsPath} && uv run ${agentConfig.flexTimeScriptPath} -q "${enhancedPrompt}" -c "${codebasePath}"`;
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Installed') && !stderr.includes('Warning')) {
          console.error(`FlexTime Codebase Agent Error: ${stderr}`);
        }
        
        return stdout;
      } catch (error) {
        console.error(`Error running FlexTime Codebase agent: ${error.message}`);
        throw error;
      }
    }
  },
  
  /**
   * Tool access methods
   */
  tools: {
    /**
     * Run a DuckDB query directly
     * 
     * @param {string} query - SQL query to execute
     * @param {string} dbPath - Path to the DuckDB database file
     * @returns {Promise<string>} Query result
     */
    async runDuckDbQuery(query, dbPath = config.agents.duckdb.databasePath) {
      const duckdbBinary = config.tools.binaries.duckdb;
      
      try {
        const command = `${duckdbBinary} ${dbPath} -c "${query}"`;
        const { stdout, stderr } = await execPromise(command);
        if (stderr) {
          console.error(`DuckDB Error: ${stderr}`);
        }
        return stdout;
      } catch (error) {
        console.error(`Error running DuckDB query: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Run a JQ command directly
     * 
     * @param {string} jqExpression - JQ expression
     * @param {string} inputFile - Path to the input JSON file
     * @param {string} outputFile - Optional path to output file
     * @returns {Promise<string>} JQ result
     */
    async runJqCommand(jqExpression, inputFile, outputFile = null) {
      const jqBinary = config.tools.binaries.jq;
      
      try {
        let command = `${jqBinary} '${jqExpression}' ${inputFile}`;
        if (outputFile) {
          command += ` > ${outputFile}`;
        }
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr) {
          console.error(`JQ Error: ${stderr}`);
        }
        return stdout;
      } catch (error) {
        console.error(`Error running JQ command: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Access other XII-OS modules and integrate with them
     * 
     * @param {string} moduleName - Name of the module to access
     * @returns {Object} Module interface or null if not found
     */
    getXiiModule(moduleName) {
      const moduleConfig = config.tools.modules[moduleName];
      
      if (!moduleConfig) {
        console.error(`Module not found: ${moduleName}`);
        return null;
      }
      
      try {
        // Dynamic require of the module
        // In a real implementation, this would properly handle module loading
        // This is a placeholder
        return {
          path: moduleConfig,
          name: moduleName,
          // Mock interface
          isAvailable: true
        };
      } catch (error) {
        console.error(`Error loading module ${moduleName}: ${error.message}`);
        return null;
      }
    }
  },
  
  /**
   * XII-OS specific scheduling utilities
   */
  scheduling: {
    /**
     * Get all campus conflicts for a given date range
     * 
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @param {string} school - Optional school code to filter by
     * @returns {Array} List of campus conflicts
     */
    async getCampusConflicts(startDate, endDate, school = null) {
      try {
        // Base query to get conflicts
        let query = `
          SELECT * FROM campus_conflicts 
          WHERE date >= '${startDate}' AND date <= '${endDate}'
        `;
        
        // Add school filter if provided
        if (school) {
          query += ` AND school = '${school}'`;
        }
        
        // Order by date
        query += ` ORDER BY date, school`;
        
        // Execute query using DuckDB tool
        const result = await flextime.tools.runDuckDbQuery(query);
        return result;
      } catch (error) {
        console.error(`Error getting campus conflicts: ${error.message}`);
        return `Error: ${error.message}`;
      }
    },
    
    /**
     * Generate a schedule for a specific sport
     * 
     * @param {string} sport - Sport code (e.g. 'basketball', 'football')
     * @param {string} season - Season (e.g. '2025-26')
     * @param {Object} options - Scheduling options
     * @returns {Promise<Object>} Generated schedule
     */
    async generateSchedule(sport, season, options = {}) {
      try {
        // Use the DuckDB agent to generate a schedule with natural language
        const promptTemplate = `Generate a ${sport} schedule for the ${season} season following these requirements:
          
- Balance home/away games for each team
- Respect travel partnerships where applicable
- Avoid campus conflicts
- Space games appropriately for rest periods
${options.additionalRequirements || ''}`;
        
        const result = await flextime.agents.runDuckDbAgent(promptTemplate);
        return {
          sport,
          season,
          generatedBy: 'FlexTime XII-OS',
          timestamp: new Date().toISOString(),
          result
        };
      } catch (error) {
        console.error(`Error generating schedule: ${error.message}`);
        return { error: error.message };
      }
    },
    
    /**
     * Optimize travel for a given schedule
     * 
     * @param {string} sport - Sport code
     * @param {string} season - Season 
     * @returns {Promise<Object>} Optimization results
     */
    async optimizeTravel(sport, season) {
      try {
        // Prompt for the DuckDB agent to optimize travel
        const promptTemplate = `Analyze the ${sport} schedule for ${season} season and optimize travel by:
        
1. Grouping nearby away games for road trips
2. Minimizing total travel distance
3. Balancing travel burden across all schools
4. Respecting travel partnerships

Show the current vs. optimized travel statistics.`;
        
        const result = await flextime.agents.runDuckDbAgent(promptTemplate);
        return {
          sport,
          season,
          optimization: 'travel',
          timestamp: new Date().toISOString(),
          result
        };
      } catch (error) {
        console.error(`Error optimizing travel: ${error.message}`);
        return { error: error.message };
      }
    },
    
    /**
     * Advanced schedule optimizer using COMPASS data
     * 
     * @param {string} sport - Sport code (e.g. 'basketball', 'football')
     * @param {string} season - Season (e.g. '2025-26')
     * @param {Object} options - Optimization options
     * @returns {Promise<Object>} Optimized schedule with travel data
     */
    async optimizeWithCompass(sport, season, options = {}) {
      try {
        // Get the current schedule
        let currentSchedule;
        try {
          const query = `
            SELECT * FROM games 
            JOIN schedules ON games.schedule_id = schedules.id
            WHERE schedules.sport_id = '${sport}' 
            AND schedules.season = '${season}'
          `;
          currentSchedule = await flextime.tools.runDuckDbQuery(query);
        } catch (error) {
          console.warn(`Could not find existing schedule, generating sample: ${error.message}`);
          // Create a sample schedule if none exists
          currentSchedule = { 
            scheduleId: 0,
            games: []
          };
        }
        
        // Use COMPASS integration to optimize the schedule
        const optimizedSchedule = await compassIntegration.optimizeSchedule(currentSchedule);
        
        // Generate recommendations using AI agent
        const promptTemplate = `
          I have a ${sport} schedule for the ${season} season that's been optimized for travel.
          The optimization resulted in these improvements:
          - Total travel distance reduced by ${optimizedSchedule.optimizationMetrics.totalTravelDistance.improvement}
          - Average travel time reduced by ${optimizedSchedule.optimizationMetrics.averageTravelTime.improvement}
          
          What additional improvements could be made considering:
          - Academic calendars
          - Traditional rivalry games
          - TV broadcast potential
          - Rest days between games
        `;
        
        const aiRecommendations = await flextime.agents.runDuckDbAgent(promptTemplate);
        
        // Combine AI and COMPASS recommendations
        return {
          ...optimizedSchedule,
          aiRecommendations,
          dashboardComponents: await compassIntegration.getDashboardComponents()
        };
      } catch (error) {
        console.error(`Error optimizing schedule with COMPASS: ${error.message}`);
        return { error: error.message };
      }
    },
    
    /**
     * Generate a schedule using the Head Coach agent
     * 
     * @param {string} sport - Sport code (e.g. 'basketball', 'football')
     * @param {string} season - Season (e.g. '2025-26')
     * @param {Object} options - Scheduling options
     * @returns {Promise<Object>} Generated schedule with recommendations
     */
    async generateScheduleWithHeadCoach(sport, season, options = {}) {
      try {
        // Use the Head Coach agent to coordinate schedule generation
        const prompt = `Generate a ${sport} schedule for the ${season} season with these requirements:
          
- Balance home/away games for each team
- Respect travel partnerships where applicable
- Avoid campus conflicts
- Space games appropriately for rest periods
- Minimize travel distance and costs
- Consider TV broadcast potential
${options.additionalRequirements || ''}`;
        
        const result = await flextime.agents.runHeadCoachAgent(prompt);
        return {
          sport,
          season,
          generatedBy: 'FlexTime XII-OS Head Coach',
          timestamp: new Date().toISOString(),
          result
        };
      } catch (error) {
        console.error(`Error generating schedule with Head Coach: ${error.message}`);
        return { error: error.message };
      }
    },
    
    /**
     * Generate a travel-optimized schedule using the COMPASS Integration agent
     * 
     * @param {string} sport - Sport code (e.g. 'basketball', 'football')
     * @param {string} season - Season (e.g. '2025-26')
     * @param {Object} options - Scheduling options
     * @returns {Promise<Object>} Generated schedule with travel optimization
     */
    async generateTravelOptimizedSchedule(sport, season, options = {}) {
      try {
        // Use the COMPASS Integration agent to generate a travel-optimized schedule
        const prompt = `Generate and optimize a ${sport} schedule for the ${season} season with these requirements:
          
- Balance home/away games for each team
- Create optimal travel partnerships based on geographic proximity
- Minimize total travel distance and cost
- Account for weather patterns at different locations
- Avoid scheduling games during severe weather periods
- Create logical road trips to minimize back-and-forth travel
${options.additionalRequirements || ''}`;
        
        const result = await flextime.agents.runCompassIntegrationAgent(prompt);
        return {
          sport,
          season,
          generatedBy: 'FlexTime COMPASS Integration',
          timestamp: new Date().toISOString(),
          result
        };
      } catch (error) {
        console.error(`Error generating travel-optimized schedule: ${error.message}`);
        return { error: error.message };
      }
    },
    
    /**
     * Analyze weather impact on a schedule using the COMPASS Integration agent
     * 
     * @param {string} sport - Sport code
     * @param {string} season - Season
     * @param {Object} schedule - Existing schedule
     * @returns {Promise<Object>} Weather analysis results
     */
    async analyzeWeatherImpact(sport, season, schedule = null) {
      try {
        // Use the COMPASS Integration agent to analyze weather impact
        const prompt = `Analyze weather patterns and their potential impact on the ${sport} ${season} schedule.
        Identify high-risk games that might be affected by adverse weather conditions.
        Recommend any scheduling adjustments to mitigate weather-related risks.`;
        
        const result = await flextime.agents.runCompassIntegrationAgent(prompt);
        return {
          sport,
          season,
          analysis: 'weather',
          timestamp: new Date().toISOString(),
          result
        };
      } catch (error) {
        console.error(`Error analyzing weather impact: ${error.message}`);
        return { error: error.message };
      }
    },
    
    /**
     * Generate detailed travel itineraries for a team using the COMPASS Integration agent
     * 
     * @param {string} schoolCode - School identifier
     * @param {string} sport - Sport code
     * @param {string} season - Season
     * @returns {Promise<Object>} Travel itineraries
     */
    async generateTravelItineraries(schoolCode, sport, season) {
      try {
        // Use the COMPASS Integration agent to generate travel itineraries
        const prompt = `Generate detailed travel itineraries for ${schoolCode}'s ${sport} team for the ${season} season.
        Include transportation methods, estimated costs, weather considerations, and logistics recommendations.`;
        
        const result = await flextime.agents.runCompassIntegrationAgent(prompt);
        return {
          school: schoolCode,
          sport,
          season,
          timestamp: new Date().toISOString(),
          result
        };
      } catch (error) {
        console.error(`Error generating travel itineraries: ${error.message}`);
        return { error: error.message };
      }
    }
  },
  
  /**
   * COMPASS integration - provides access to all COMPASS features
   */
  compass: {
    /**
     * Get comprehensive school data including geography, travel, and weather
     * 
     * @param {string} schoolId - School identifier
     * @returns {Promise<Object>} Combined school data
     */
    async getSchoolData(schoolId) {
      try {
        // Get basic school data
        const schoolData = flextime.getSchoolBranding(schoolId);
        
        // Get COMPASS data
        const compassData = await compassIntegration.getSchoolData(schoolId);
        
        // Combine data
        return {
          ...schoolData,
          ...compassData,
          id: schoolId
        };
      } catch (error) {
        console.error(`Error getting comprehensive school data: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Get travel distances between all schools or a subset
     * 
     * @param {Array<string>} schoolIds - Optional list of school IDs to include
     * @returns {Promise<Object>} Travel distance matrix
     */
    async getTravelDistances(schoolIds = null) {
      try {
        // If no schools specified, get all school IDs
        if (!schoolIds) {
          const query = "SELECT id FROM schools";
          const result = await flextime.tools.runDuckDbQuery(query);
          // Parse the result string to extract IDs
          schoolIds = result.split('\n')
            .filter(line => line.trim() && !line.includes('─') && !line.includes('id'))
            .map(line => line.trim());
        }
        
        // Use COMPASS to get distances
        return await compassIntegration.getTravelDistances(schoolIds);
      } catch (error) {
        console.error(`Error getting travel distances: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Get weather forecasts for multiple schools in a date range
     * 
     * @param {Array<string>} schoolIds - School identifiers
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Object>} Weather forecasts by school
     */
    async getWeatherForecasts(schoolIds, startDate, endDate) {
      try {
        const forecasts = {};
        
        // Get forecasts for each school
        for (const schoolId of schoolIds) {
          forecasts[schoolId] = await compassIntegration.getWeatherForecast(
            schoolId, 
            startDate, 
            endDate
          );
        }
        
        return {
          period: { startDate, endDate },
          forecasts,
          weatherAlerts: Object.values(forecasts)
            .flatMap(f => f.weatherAdvisories || [])
        };
      } catch (error) {
        console.error(`Error getting weather forecasts: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Generate trip planning report with COMPASS data
     * 
     * @param {string} sport - Sport code
     * @param {string} season - Season
     * @returns {Promise<Object>} Trip planning data
     */
    async generateTripPlanningReport(sport, season) {
      try {
        // Get all schools
        const query = "SELECT id FROM schools";
        const schoolIdsResult = await flextime.tools.runDuckDbQuery(query);
        const schoolIds = schoolIdsResult.split('\n')
          .filter(line => line.trim() && !line.includes('─') && !line.includes('id'))
          .map(line => line.trim());
        
        // Generate travel itineraries for each school
        const travelItineraries = {};
        for (const schoolId of schoolIds) {
          travelItineraries[schoolId] = await compassIntegration.generateTravelItinerary(
            schoolId,
            sport,
            season
          );
        }
        
        // Compile into a comprehensive report
        return {
          sport,
          season,
          generatedAt: new Date().toISOString(),
          travelItineraries,
          summary: {
            totalTrips: Object.values(travelItineraries)
              .reduce((sum, itinerary) => sum + itinerary.trips.length, 0),
            totalEstimatedCost: Object.values(travelItineraries)
              .reduce((sum, itinerary) => sum + itinerary.totalEstimatedCost, 0),
            longestTrip: Object.values(travelItineraries)
              .flatMap(itinerary => itinerary.trips)
              .reduce((longest, trip) => {
                const duration = new Date(trip.returnDate) - new Date(trip.departureDate);
                return duration > longest.duration 
                  ? { duration, trip } 
                  : longest;
              }, { duration: 0, trip: null }).trip
          },
          dashboardComponents: await compassIntegration.getDashboardComponents()
        };
      } catch (error) {
        console.error(`Error generating trip planning report: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Get COMPASS dashboard components for XII-OS
     * 
     * @returns {Promise<Array>} Dashboard components
     */
    async getDashboardComponents() {
      return await compassIntegration.getDashboardComponents();
    }
  },
  
  /**
   * Dashboard integration - components for the XII-OS dashboard
   */
  dashboard: {
    /**
     * Get all dashboard components from FlexTime and its integrations
     * 
     * @returns {Promise<Array>} Dashboard components
     */
    async getComponents() {
      try {
        // Get COMPASS components
        const compassComponents = await compassIntegration.getDashboardComponents();
        
        // FlexTime native components
        const flexTimeComponents = [
          {
            id: 'flextime-schedule-calendar',
            type: 'calendar',
            title: 'Master Schedule',
            dataSource: 'flextime.masterSchedule',
            refreshInterval: 3600,
            permissions: ['admin', 'scheduler', 'coach'],
            size: { width: 3, height: 2 }
          },
          {
            id: 'flextime-conflicts',
            type: 'alert-panel',
            title: 'Scheduling Conflicts',
            dataSource: 'flextime.conflicts',
            refreshInterval: 900,
            permissions: ['admin', 'scheduler'],
            size: { width: 1, height: 1 }
          },
          {
            id: 'flextime-school-selector',
            type: 'filter',
            title: 'School Filter',
            dataSource: 'flextime.schools',
            refreshInterval: 86400,
            permissions: ['admin', 'scheduler', 'coach'],
            size: { width: 1, height: 1 }
          }
        ];
        
        // Combine all components
        return [
          ...flexTimeComponents,
          ...compassComponents
        ];
      } catch (error) {
        console.error(`Error getting dashboard components: ${error.message}`);
        return [];
      }
    },
    
    /**
     * Get data for a specific dashboard component
     * 
     * @param {string} componentId - Dashboard component ID
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} Component data
     */
    async getComponentData(componentId, filters = {}) {
      try {
        // Route the request to the appropriate data provider
        if (componentId.startsWith('compass-')) {
          // This would call the appropriate COMPASS method
          return { componentId, source: 'compass', data: {} };
        } else if (componentId.startsWith('flextime-')) {
          // Handle FlexTime-specific components
          switch (componentId) {
            case 'flextime-schedule-calendar':
              // Get scheduling data for calendar
              return { 
                componentId, 
                source: 'flextime',
                data: { 
                  events: [] // Calendar events would go here
                }
              };
            case 'flextime-conflicts':
              // Get conflict data
              return { 
                componentId, 
                source: 'flextime',
                data: { 
                  conflicts: [] // Conflict data would go here
                }
              };
            case 'flextime-school-selector':
              // Get school list
              const query = "SELECT id, name FROM schools";
              const result = await flextime.tools.runDuckDbQuery(query);
              // Process the result string
              return { 
                componentId, 
                source: 'flextime',
                data: { 
                  schools: [] // School list would go here
                }
              };
            default:
              throw new Error(`Unknown component ID: ${componentId}`);
          }
        } else {
          throw new Error(`Unknown component source: ${componentId}`);
        }
      } catch (error) {
        console.error(`Error getting component data for ${componentId}: ${error.message}`);
        return { componentId, error: error.message };
      }
    }
  },
  
  /**
   * Validates a proposed schedule against historical patterns and traditions
   * @param {string} sport - The sport (e.g., 'football', 'basketball')
   * @param {string} season - The season (e.g., '2023-2024')
   * @param {Object} schedule - The proposed schedule to validate
   * @returns {Promise<Object>} - Validation results with tradition adherence score and recommendations
   */
  async validateScheduleAgainstTraditions(sport, season, schedule) {
    try {
      const scheduleJson = JSON.stringify(schedule);
      
      // Construct prompt for the historical patterns agent
      const prompt = `Validate this ${sport} schedule for the ${season} season against historical Big 12 traditions and patterns. 
      Check for adherence to rivalry game scheduling windows, travel partner arrangements, and other sport-specific traditions.
      Highlight any violations or deviations that require user approval.
      
      Schedule data: ${scheduleJson}`;
      
      // Get results from the Historical Patterns agent
      const results = await utils.runAgent(
        config.agents.historicalPatterns.flexTimeScriptPath,
        prompt,
        prompts.historicalPatterns.systemPrompt
      );
      
      return utils.parseAgentResponse(results);
    } catch (error) {
      console.error('Error validating schedule against traditions:', error);
      throw error;
    }
  },
  
  /**
   * Analyzes historical patterns for a specific sport
   * @param {string} sport - The sport to analyze
   * @returns {Promise<Object>} - Analysis of historical patterns and traditions
   */
  async analyzeHistoricalPatterns(sport) {
    try {
      // Construct prompt for the historical patterns agent
      const prompt = `Analyze historical scheduling patterns for ${sport} in the Big 12 Conference. 
      Identify key traditions, rivalries, and scheduling parameters that should be preserved.`;
      
      // Get results from the Historical Patterns agent
      const results = await utils.runAgent(
        config.agents.historicalPatterns.flexTimeScriptPath,
        prompt,
        prompts.historicalPatterns.systemPrompt
      );
      
      return utils.parseAgentResponse(results);
    } catch (error) {
      console.error('Error analyzing historical patterns:', error);
      throw error;
    }
  },
  
  /**
   * Gets information about traditional rivalries for a sport
   * @param {string} sport - The sport to get rivalry information for
   * @returns {Promise<Object>} - Rivalry information including games, dates, and importance
   */
  async getTraditionsAndRivalries(sport) {
    try {
      // Construct prompt for the historical patterns agent
      const prompt = `What are the traditional rivalries and scheduling traditions for ${sport} in the Big 12 Conference?
      Include rivalry names, involved teams, traditional scheduling windows, and importance ratings.`;
      
      // Get results from the Historical Patterns agent
      const results = await utils.runAgent(
        config.agents.historicalPatterns.flexTimeScriptPath,
        prompt,
        prompts.historicalPatterns.systemPrompt
      );
      
      return utils.parseAgentResponse(results);
    } catch (error) {
      console.error('Error getting traditions and rivalries:', error);
      throw error;
    }
  },
  
  /**
   * Creates a schedule that preserves historical patterns while also optimizing for travel
   * @param {string} sport - The sport to create schedule for
   * @param {string} season - The season (e.g., '2023-2024')
   * @param {Object} options - Additional options for schedule creation
   * @returns {Promise<Object>} - Optimized schedule preserving traditions
   */
  async createTraditionPreservingSchedule(sport, season, options = {}) {
    try {
      // Step 1: Analyze historical patterns
      const historicalPatterns = await analyzeHistoricalPatterns(sport);
      
      // Step 2: Get traditional rivalries
      const rivalries = await getTraditionsAndRivalries(sport);
      
      // Step 3: Generate initial travel-optimized schedule
      const initialSchedule = await generateTravelOptimizedSchedule(sport, season, options);
      
      // Step 4: Validate against historical patterns
      const validation = await validateScheduleAgainstTraditions(sport, season, initialSchedule);
      
      // Step 5: If there are tradition violations, modify the schedule
      if (!validation.is_valid) {
        // Construct prompt for the head coach agent to coordinate fixing the schedule
        const prompt = `I need to create a ${sport} schedule for the ${season} season that:
        1. Preserves all historical traditions and rivalries
        2. Optimizes for travel efficiency
        3. Addresses these specific violations: ${JSON.stringify(validation.violations)}
        
        Historical patterns: ${JSON.stringify(historicalPatterns)}
        Traditional rivalries: ${JSON.stringify(rivalries)}
        Current schedule draft: ${JSON.stringify(initialSchedule)}`;
        
        // Use the head coach agent to coordinate between historical patterns and COMPASS agents
        const results = await utils.runAgent(
          config.agents.headCoach.flexTimeScriptPath,
          prompt,
          prompts.headCoach.systemPrompt
        );
        
        return utils.parseAgentResponse(results);
      }
      
      return initialSchedule;
    } catch (error) {
      console.error('Error creating tradition-preserving schedule:', error);
      throw error;
    }
  },
  
  /**
   * Detects campus conflicts in a proposed schedule
   * @param {Object} schedule - The schedule to check for conflicts
   * @param {Object} options - Options for conflict detection
   * @returns {Promise<Array>} - List of detected conflicts
   */
  async detectCampusConflicts(schedule, options = {}) {
    try {
      const scheduleJson = JSON.stringify(schedule);
      
      // Construct prompt for the campus conflicts agent
      const prompt = `Detect any venue conflicts in this schedule, focusing on shared venues at schools like ASU, ISU, and WVU.
      
      Schedule data: ${scheduleJson}
      
      Please identify both hard conflicts (must be resolved) and soft conflicts (preferably avoided).
      For tennis matches, also note any cases where men's and women's teams are scheduled at the same facility on the same day.`;
      
      // Get results from the Campus Conflicts agent
      const results = await utils.runAgent(
        config.agents.campusConflicts.flexTimeScriptPath,
        prompt,
        prompts.campusConflicts.systemPrompt
      );
      
      return utils.parseAgentResponse(results);
    } catch (error) {
      console.error('Error detecting campus conflicts:', error);
      throw error;
    }
  },
  
  /**
   * Resolves campus conflicts in a schedule
   * @param {Object} schedule - The schedule with conflicts
   * @param {Array} conflicts - The list of conflicts to resolve
   * @param {Object} options - Options for conflict resolution
   * @returns {Promise<Object>} - Modified schedule with resolved conflicts
   */
  async resolveCampusConflicts(schedule, conflicts, options = {}) {
    try {
      const scheduleJson = JSON.stringify(schedule);
      const conflictsJson = JSON.stringify(conflicts);
      
      // Construct prompt for the campus conflicts agent
      const prompt = `Resolve the following venue conflicts in this schedule:
      
      Schedule data: ${scheduleJson}
      
      Conflicts to resolve: ${conflictsJson}
      
      Please provide a modified schedule that resolves all hard conflicts and as many soft conflicts as possible.
      Prioritize resolving conflicts at ASU, ISU, and WVU where venue sharing is particularly complex.
      For men's and women's tennis conflicts, try to schedule them on different days when possible.`;
      
      // Get results from the Campus Conflicts agent
      const results = await utils.runAgent(
        config.agents.campusConflicts.flexTimeScriptPath,
        prompt,
        prompts.campusConflicts.systemPrompt
      );
      
      return utils.parseAgentResponse(results);
    } catch (error) {
      console.error('Error resolving campus conflicts:', error);
      throw error;
    }
  },
  
  /**
   * Gets information about shared venues for a specific school
   * @param {string} schoolCode - The school code (e.g., 'arizona_state')
   * @returns {Promise<Object>} - Information about shared venues at the school
   */
  async getSharedVenueInfo(schoolCode) {
    try {
      // Construct prompt for the campus conflicts agent
      const prompt = `Provide venue information for ${schoolCode}, including:
      1. All shared venues and the sports that use them
      2. Priority order for each venue
      3. Required transition times between different sports
      4. Any school-specific venue scheduling guidelines`;
      
      // Get results from the Campus Conflicts agent
      const results = await utils.runAgent(
        config.agents.campusConflicts.flexTimeScriptPath,
        prompt,
        prompts.campusConflicts.systemPrompt
      );
      
      return utils.parseAgentResponse(results);
    } catch (error) {
      console.error('Error getting shared venue info:', error);
      throw error;
    }
  },
  
  /**
   * Creates an optimized schedule that minimizes venue conflicts
   * @param {string} sport - The sport to schedule
   * @param {string} season - The season for scheduling
   * @param {Object} options - Additional options for schedule creation
   * @returns {Promise<Object>} - Optimized schedule with minimal venue conflicts
   */
  async createConflictMinimizedSchedule(sport, season, options = {}) {
    try {
      // Step 1: Generate an initial schedule draft
      const initialSchedule = await generateSchedule(sport, season, options);
      
      // Step 2: Detect any campus conflicts in the draft
      const conflicts = await detectCampusConflicts(initialSchedule, options);
      
      // Step 3: If there are conflicts, resolve them
      if (conflicts && conflicts.length > 0) {
        console.log(`Detected ${conflicts.length} venue conflicts. Resolving...`);
        return await resolveCampusConflicts(initialSchedule, conflicts, options);
      }
      
      // No conflicts to resolve
      return initialSchedule;
    } catch (error) {
      console.error('Error creating conflict-minimized schedule:', error);
      throw error;
    }
  },
  
  /**
   * Gets venue information for a given school
   * @param {string} schoolCode - The school code (e.g., "arizona_state")
   * @param {Object} options - Options for retrieving venue info
   * @returns {Promise<Object>} - Venue information for the specified school
   */
  async getVenueInfo(schoolCode, options = {}) {
    try {
      // Load venue data from the centralized data store
      const venueDataPath = '/Users/nickthequick/XII-OS/data/venue_data/big12_venues.json';
      const fs = require('fs').promises;
      
      let venueData;
      try {
        const fileContents = await fs.readFile(venueDataPath, 'utf8');
        venueData = JSON.parse(fileContents);
      } catch (err) {
        console.error('Error reading venue data file:', err);
        throw new Error('Failed to load venue data');
      }
      
      // If a specific school is requested
      if (schoolCode) {
        if (venueData.schools && venueData.schools[schoolCode]) {
          return venueData.schools[schoolCode];
        } else {
          throw new Error(`No venue data found for school: ${schoolCode}`);
        }
      }
      
      // If no school specified, return all venue data
      return venueData;
    } catch (error) {
      console.error('Error retrieving venue information:', error);
      throw error;
    }
  },
  
  /**
   * Gets shared venue information for conflict detection
   * @param {string} schoolCode - The school code
   * @param {Object} options - Options for retrieving shared venue info
   * @returns {Promise<Object>} - Information about shared venues at the school
   */
  async getSharedVenueInfo(schoolCode, options = {}) {
    try {
      // Get school venue information
      const schoolVenueInfo = await this.getVenueInfo(schoolCode);
      
      // Filter to only include shared venues (venues used by multiple sports)
      const sharedVenues = {};
      
      if (schoolVenueInfo && schoolVenueInfo.venues) {
        schoolVenueInfo.venues.forEach(venue => {
          if (venue.sports && venue.sports.length > 1) {
            sharedVenues[venue.name] = {
              sports: venue.sports,
              priority_order: venue.priority_order || [],
              transition_times: venue.transition_times || {},
              notes: venue.notes || ""
            };
          }
        });
      }
      
      // Construct prompt for the Campus Conflicts agent
      const prompt = `Provide information about shared venues at ${schoolCode}, including:
      - List of all shared venues
      - Sports that use each venue
      - Priority order for scheduling conflicts
      - Transition times between different sports
      - Any special notes about each venue`;
      
      // Get additional context from the Campus Conflicts agent
      const agentResponse = await utils.runAgent(
        config.agents.campusConflicts.flexTimeScriptPath,
        prompt,
        prompts.campusConflicts.systemPrompt
      );
      
      return {
        sharedVenues,
        agentContext: agentResponse
      };
    } catch (error) {
      console.error('Error retrieving shared venue information:', error);
      throw error;
    }
  },
  
  /**
   * Runs the Venue Data agent with the specified prompt
   * @param {string} prompt - The prompt for the Venue Data agent
   * @param {Object} options - Additional options for the agent
   * @returns {Promise<any>} - The agent's response
   */
  async runVenueDataAgent(prompt, options = {}) {
    try {
      // Construct the full prompt with any additional context
      let fullPrompt = prompt;
      
      if (options.schoolCode) {
        fullPrompt = `Provide information about venues at ${options.schoolCode.replace('_', ' ').toUpperCase()}: ${prompt}`;
      }
      
      if (options.includeStatus) {
        fullPrompt = `${fullPrompt}\n\nPlease include current venue data status in your response.`;
      }
      
      // Get results from the Venue Data agent
      const results = await utils.runAgent(
        config.agents.venueData.flexTimeScriptPath,
        fullPrompt,
        prompts.venueData.systemPrompt
      );
      
      return utils.parseAgentResponse(results);
    } catch (error) {
      console.error('Error running Venue Data agent:', error);
      throw error;
    }
  },
  
  /**
   * Sources venue data for a specific school or all schools
   * @param {string} schoolCode - Optional school code to source data for
   * @param {Object} options - Options for data sourcing
   * @returns {Promise<Object>} - Results of the data sourcing operation
   */
  async sourceVenueData(schoolCode = null, options = {}) {
    try {
      let prompt;
      
      if (schoolCode) {
        prompt = `Source venue data for ${schoolCode.replace('_', ' ').toUpperCase()} athletics facilities. 
                 Gather information from official websites and publications.`;
      } else {
        prompt = `Source venue data for all Big 12 schools' athletics facilities.
                 Gather information from official websites and publications.`;
      }
      
      if (options.focusOn) {
        prompt += ` Focus on gathering information about ${options.focusOn} venues.`;
      }
      
      if (options.includeCoordinates) {
        prompt += ` Include geographic coordinates for each venue when available.`;
      }
      
      const results = await this.runVenueDataAgent(prompt, {
        schoolCode: schoolCode,
        includeStatus: true
      });
      
      return {
        message: "Venue data sourcing initiated",
        details: results
      };
    } catch (error) {
      console.error('Error sourcing venue data:', error);
      throw error;
    }
  },
  
  /**
   * Validates the venue data against the schema
   * @param {Object} options - Options for validation
   * @returns {Promise<Object>} - Results of the validation
   */
  async validateVenueData(options = {}) {
    try {
      const prompt = `Validate all venue data against the schema. 
                     Identify any missing required fields or inconsistencies.`;
      
      const results = await this.runVenueDataAgent(prompt, {
        includeStatus: true
      });
      
      return {
        message: "Venue data validation completed",
        details: results
      };
    } catch (error) {
      console.error('Error validating venue data:', error);
      throw error;
    }
  },
  
  /**
   * Create a game operations plan for a specific event
   * 
   * @param {Object} options - Options for the operations plan
   * @param {string} options.school - School code (e.g., 'kansas')
   * @param {string} options.sport - Sport code (e.g., 'mbasketball')
   * @param {string} options.venue - Venue name (optional, will be determined if not provided)
   * @param {string} options.date - Event date (YYYY-MM-DD)
   * @param {string} options.time - Event time (HH:MM in 24-hour format)
   * @returns {Promise<Object>} - Operations plan
   */
  async createGameOperationsPlan(options = {}) {
    try {
      // Construct the prompt for the Game Manager agent
      const prompt = `Create a game operations plan for ${options.sport.replace('m', 'Men\'s ').replace('w', 'Women\'s ')} at ${options.school} on ${options.date} at ${options.time}${options.venue ? ` at ${options.venue}` : ''}`;
      
      // Call the Game Manager agent
      const response = await this.callAgent('gameManager', prompt);
      
      // Parse the response (in a real implementation, we would parse the structured data)
      // For now, return a simple object with the raw response
      return {
        school: options.school,
        sport: options.sport,
        date: options.date,
        time: options.time,
        venue: options.venue,
        operationsPlan: response
      };
    } catch (error) {
      console.error('Error creating game operations plan:', error);
      throw error;
    }
  },
  
  /**
   * Assess weather risks for a scheduled event
   * 
   * @param {Object} options - Options for the weather assessment
   * @param {string} options.school - School code (e.g., 'kansas')
   * @param {string} options.sport - Sport code (e.g., 'mbasketball')
   * @param {string} options.date - Event date (YYYY-MM-DD)
   * @returns {Promise<Object>} - Weather risk assessment
   */
  async assessWeatherRisks(options = {}) {
    try {
      // Construct the prompt for the Game Manager agent
      const prompt = `Assess weather risks for ${options.sport.replace('m', 'Men\'s ').replace('w', 'Women\'s ')} at ${options.school} on ${options.date}`;
      
      // Call the Game Manager agent
      const response = await this.callAgent('gameManager', prompt);
      
      // Parse the response (in a real implementation, we would parse the structured data)
      // For now, return a simple object with the raw response
      return {
        school: options.school,
        sport: options.sport,
        date: options.date,
        weatherAssessment: response
      };
    } catch (error) {
      console.error('Error assessing weather risks:', error);
      throw error;
    }
  },
  
  /**
   * Check venue availability for a specific date and time
   * 
   * @param {Object} options - Options for the venue availability check
   * @param {string} options.school - School code (e.g., 'kansas')
   * @param {string} options.venue - Venue name (if known)
   * @param {string} options.sport - Sport code (e.g., 'mbasketball')
   * @param {string} options.date - Event date (YYYY-MM-DD)
   * @param {string} options.startTime - Start time (HH:MM in 24-hour format)
   * @param {string} options.endTime - End time (HH:MM in 24-hour format)
   * @returns {Promise<Object>} - Venue availability information
   */
  async checkVenueAvailability(options = {}) {
    try {
      // Construct the prompt for the Game Manager agent
      const prompt = `Check venue availability for ${options.venue || options.sport.replace('m', 'Men\'s ').replace('w', 'Women\'s ')} at ${options.school} on ${options.date} from ${options.startTime} to ${options.endTime || 'end of event'}`;
      
      // Call the Game Manager agent
      const response = await this.callAgent('gameManager', prompt);
      
      // Parse the response (in a real implementation, we would parse the structured data)
      // For now, return a simple object with the raw response
      return {
        school: options.school,
        venue: options.venue,
        sport: options.sport,
        date: options.date,
        startTime: options.startTime,
        endTime: options.endTime,
        availabilityInfo: response
      };
    } catch (error) {
      console.error('Error checking venue availability:', error);
      throw error;
    }
  },
  
  // Travel planning functions
  // getTravelPlan,
  // calculateTravelBudget,
  // getTransportationRecommendation,
  // optimizeTravelSchedule,
  // getSchoolAirportInfo,
  
  // ... existing exports ...
};

module.exports = flextime;