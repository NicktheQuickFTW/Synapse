/**
 * FlexTime Agent Utilities
 * 
 * Utility functions for managing and customizing FlexTime-specific agents
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const config = require('../config/config');
const prompts = require('./prompts');

/**
 * Copy an agent script from the single-file-agents directory to the 
 * FlexTime-specific agents directory
 * 
 * @param {string} agentType - Type of agent (e.g., 'duckdb', 'polars')
 * @returns {Promise<boolean>} - Success status
 */
async function duplicateAgent(agentType) {
  try {
    if (!config.agents[agentType]) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    const sourceScript = path.join(
      config.agents.singleFileAgentsPath,
      config.agents[agentType].scriptPath
    );
    
    const destScript = path.join(
      config.agents.flextimeAgentsPath,
      config.agents[agentType].flexTimeScriptPath
    );

    // Check if source exists
    if (!fs.existsSync(sourceScript)) {
      throw new Error(`Source script not found: ${sourceScript}`);
    }

    // Ensure destination directory exists
    if (!fs.existsSync(config.agents.flextimeAgentsPath)) {
      fs.mkdirSync(config.agents.flextimeAgentsPath, { recursive: true });
    }

    // Copy the file
    fs.copyFileSync(sourceScript, destScript);
    console.log(`Successfully duplicated ${agentType} agent to: ${destScript}`);
    return true;
  } catch (error) {
    console.error(`Error duplicating agent ${agentType}: ${error.message}`);
    return false;
  }
}

/**
 * Initialize all FlexTime-specific agents by duplicating them
 * from the single-file-agents directory
 * 
 * @returns {Promise<Object>} - Results of duplication operations
 */
async function initializeFlexTimeAgents() {
  const agentTypes = ['duckdb', 'polars', 'scraper', 'jq', 'codebase', 'bash'];
  const results = {};

  for (const agentType of agentTypes) {
    results[agentType] = await duplicateAgent(agentType);
    
    // After duplicating, immediately customize with FlexTime system prompt
    if (results[agentType]) {
      await customizeAgent(agentType, {
        useFlexTimeSystemPrompt: true
      });
    }
  }
  
  // Create special agents that don't have a single-file equivalent
  await createCompassIntegrationAgent();
  await createHeadCoachAgent();
  
  return results;
}

/**
 * Create the COMPASS Integration agent from scratch (not duplicated)
 * 
 * @returns {Promise<boolean>} - Success status
 */
async function createCompassIntegrationAgent() {
  try {
    const destPath = path.join(
      config.agents.flextimeAgentsPath,
      config.agents.compassIntegration.flexTimeScriptPath
    );
    
    // Check if the agent already exists
    if (fs.existsSync(destPath)) {
      console.log(`COMPASS Integration agent already exists at: ${destPath}`);
      return true;
    }
    
    // Ensure destination directory exists
    if (!fs.existsSync(config.agents.flextimeAgentsPath)) {
      fs.mkdirSync(config.agents.flextimeAgentsPath, { recursive: true });
    }
    
    // For this special agent, we'll create a basic script that incorporates the FlexTime system prompt
    const agentContent = `#!/usr/bin/env python3
"""
COMPASS Integration Agent for FlexTime

This agent integrates geographical, travel, and weather data from the COMPASS module
into scheduling decisions for the Big 12 Conference.
"""

import os
import sys
import argparse
import json
import datetime

# FlexTime system prompt - guides all agent behavior
FLEXTIME_SYSTEM_PROMPT = """${prompts.flexTime.systemPrompt.replace(/`/g, '\\`').replace(/"/g, '\\"')}"""

# COMPASS Integration agent specific prompt
COMPASS_AGENT_PROMPT = """${prompts.compassIntegration.systemPrompt.replace(/`/g, '\\`').replace(/"/g, '\\"')}"""

def main():
    parser = argparse.ArgumentParser(description='COMPASS Integration agent for FlexTime')
    parser.add_argument('-p', '--prompt', type=str, required=True, help='User prompt')
    parser.add_argument('--system-prompt', type=str, help='Optional system prompt override')
    args = parser.parse_args()
    
    # Use the provided system prompt or the default
    system_prompt = args.system_prompt if args.system_prompt else COMPASS_AGENT_PROMPT
    
    # Include the FlexTime system prompt as context
    full_prompt = f"FlexTime Context:\\n{FLEXTIME_SYSTEM_PROMPT}\\n\\nUser Query:\\n{args.prompt}"
    
    # Placeholder for actual agent functionality
    print(f"COMPASS Integration Agent would process: {args.prompt}")
    print("This is a placeholder implementation of the COMPASS Integration Agent.")
    print(f"It would use the FlexTime system context and COMPASS data to optimize scheduling.")

if __name__ == "__main__":
    main()
`;
    
    // Write the agent file
    fs.writeFileSync(destPath, agentContent);
    fs.chmodSync(destPath, '755'); // Make executable
    
    console.log(`Created COMPASS Integration agent at: ${destPath}`);
    return true;
  } catch (error) {
    console.error(`Error creating COMPASS Integration agent: ${error.message}`);
    return false;
  }
}

/**
 * Create the Head Coach agent from scratch (not duplicated)
 * 
 * @returns {Promise<boolean>} - Success status
 */
async function createHeadCoachAgent() {
  try {
    const destPath = path.join(
      config.agents.flextimeAgentsPath,
      config.agents.headCoach.flexTimeScriptPath
    );
    
    // Check if the agent already exists
    if (fs.existsSync(destPath)) {
      console.log(`Head Coach agent already exists at: ${destPath}`);
      return true;
    }
    
    // Ensure destination directory exists
    if (!fs.existsSync(config.agents.flextimeAgentsPath)) {
      fs.mkdirSync(config.agents.flextimeAgentsPath, { recursive: true });
    }
    
    // Create a basic script that incorporates the FlexTime system prompt
    const agentContent = `#!/usr/bin/env python3
"""
Head Coach Agent for FlexTime

This agent coordinates and manages specialized scheduling agents, optimizes their use,
and provides high-level strategic guidance on scheduling matters for the Big 12 Conference.
"""

import os
import sys
import argparse
import json
import datetime

# FlexTime system prompt - guides all agent behavior
FLEXTIME_SYSTEM_PROMPT = """${prompts.flexTime.systemPrompt.replace(/`/g, '\\`').replace(/"/g, '\\"')}"""

# Head Coach agent specific prompt
HEAD_COACH_PROMPT = """${prompts.headCoach.systemPrompt.replace(/`/g, '\\`').replace(/"/g, '\\"')}"""

def main():
    parser = argparse.ArgumentParser(description='Head Coach agent for FlexTime')
    parser.add_argument('-p', '--prompt', type=str, required=True, help='User prompt')
    parser.add_argument('--system-prompt', type=str, help='Optional system prompt override')
    args = parser.parse_args()
    
    # Use the provided system prompt or the default
    system_prompt = args.system_prompt if args.system_prompt else HEAD_COACH_PROMPT
    
    # Include the FlexTime system prompt as context
    full_prompt = f"FlexTime Context:\\n{FLEXTIME_SYSTEM_PROMPT}\\n\\nUser Query:\\n{args.prompt}"
    
    # Placeholder for actual agent functionality
    print(f"Head Coach Agent would process: {args.prompt}")
    print("This is a placeholder implementation of the Head Coach Agent.")
    print(f"It would coordinate specialized agents and provide strategic guidance on scheduling.")

if __name__ == "__main__":
    main()
`;
    
    // Write the agent file
    fs.writeFileSync(destPath, agentContent);
    fs.chmodSync(destPath, '755'); // Make executable
    
    console.log(`Created Head Coach agent at: ${destPath}`);
    return true;
  } catch (error) {
    console.error(`Error creating Head Coach agent: ${error.message}`);
    return false;
  }
}

/**
 * Customize a FlexTime agent by adding FlexTime-specific features
 * 
 * @param {string} agentType - Type of agent (e.g., 'duckdb', 'polars')
 * @param {Object} customizations - Customization options
 * @returns {Promise<boolean>} - Success status
 */
async function customizeAgent(agentType, customizations = {}) {
  try {
    if (!config.agents[agentType]) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    const agentPath = path.join(
      config.agents.flextimeAgentsPath,
      config.agents[agentType].flexTimeScriptPath
    );

    // Check if agent exists
    if (!fs.existsSync(agentPath)) {
      console.log(`Agent doesn't exist yet, duplicating first: ${agentType}`);
      if (agentType === 'compassIntegration') {
        await createCompassIntegrationAgent();
      } else if (agentType === 'headCoach') {
        await createHeadCoachAgent();
      } else {
        await duplicateAgent(agentType);
      }
    }

    // If it's a special agent, it's created directly, not customized
    if (agentType === 'compassIntegration' || agentType === 'headCoach') {
      return true;
    }

    // Read the agent file
    let agentContent = fs.readFileSync(agentPath, 'utf8');

    // Apply customizations based on agent type
    switch (agentType) {
      case 'duckdb':
        agentContent = customizeDuckDbAgent(agentContent, customizations);
        break;
      case 'polars':
        agentContent = customizePolarsAgent(agentContent, customizations);
        break;
      case 'jq':
        agentContent = customizeJqAgent(agentContent, customizations);
        break;
      case 'bash':
        agentContent = customizeBashAgent(agentContent, customizations);
        break;
      case 'scraper':
        agentContent = customizeScraperAgent(agentContent, customizations);
        break;
      case 'codebase':
        agentContent = customizeCodebaseAgent(agentContent, customizations);
        break;
    }

    // Write back the modified content
    fs.writeFileSync(agentPath, agentContent);
    console.log(`Successfully customized ${agentType} agent`);
    return true;
  } catch (error) {
    console.error(`Error customizing agent ${agentType}: ${error.message}`);
    return false;
  }
}

/**
 * Add FlexTime customizations to DuckDB agent
 * 
 * @param {string} content - Original agent content
 * @param {Object} customizations - Customization options
 * @returns {string} - Modified agent content
 */
function customizeDuckDbAgent(content, customizations) {
  // Add FlexTime-specific imports
  const importSection = "import os\nimport sys\nimport argparse\n";
  const newImports = "# FlexTime-specific imports\nimport json\nimport datetime\n";
  content = content.replace(importSection, importSection + newImports);

  // Add FlexTime system prompt as a constant
  const flexTimeSystemPrompt = `
# FlexTime system prompt - guides all agent behavior
FLEXTIME_SYSTEM_PROMPT = """${prompts.flexTime.systemPrompt.replace(/`/g, '\\`').replace(/"/g, '\\"')}"""

# DuckDB agent specific prompt
DUCKDB_AGENT_PROMPT = """${prompts.duckdb.systemPrompt.replace(/`/g, '\\`').replace(/"/g, '\\"')}"""
`;

  // Add FlexTime-specific constants and context
  const flexTimeContext = `
# FlexTime-specific constants
FLEXTIME_VERSION = "1.0.0"
FLEXTIME_MODULE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

# FlexTime-specific context for the Big 12 Conference
BIG12_SCHOOLS = [
    "arizona", "arizona_state", "baylor", "byu", "cincinnati", 
    "colorado", "houston", "iowa_state", "kansas", "kansas_state", 
    "oklahoma_state", "tcu", "texas_tech", "ucf", "utah", "west_virginia"
]

# FlexTime-specific scheduling parameters
SCHEDULING_SPORTS = [
    "mbasketball", "wbasketball", "football", "baseball", "softball", 
    "mtennis", "wtennis", "volleyball", "soccer", "wrestling", 
    "gymnastics", "lacrosse"
]

def get_flextime_context():
    """Get FlexTime-specific context for enhancing agent capabilities"""
    try:
        school_info_path = os.path.join("/Users/nickthequick/XII-OS/data/school_branding", "school_info.json")
        if os.path.exists(school_info_path):
            with open(school_info_path, 'r') as f:
                school_data = json.load(f)
            
            context = "Current Big 12 schools with their primary colors:\\n"
            for school_key, school in school_data.items():
                primary_color = school.get('primary_color', 'Unknown')
                context += f"- {school.get('name')}: {primary_color}\\n"
            
            return context
        return ""
    except Exception as e:
        print(f"Error generating FlexTime context: {str(e)}", file=sys.stderr)
        return ""
`;

  // Add the FlexTime context after the imports
  const afterImports = content.indexOf('\n\n', content.indexOf('import'));
  content = content.slice(0, afterImports) + flexTimeSystemPrompt + flexTimeContext + content.slice(afterImports);

  // Enhance the main function to include FlexTime context
  if (content.includes('def main():')) {
    const enhancedMain = `
def main():
    # Add FlexTime-specific context to the prompt
    flextime_context = get_flextime_context()
    
    parser = argparse.ArgumentParser(description='DuckDB agent for natural language querying')
    parser.add_argument('--system-prompt', type=str, help='Optional system prompt override')`;
    
    content = content.replace('def main():\n    parser = argparse.ArgumentParser', enhancedMain);
    
    // Add system prompt argument parsing
    if (content.includes('args = parser.parse_args()')) {
      content = content.replace(
        'args = parser.parse_args()',
        `args = parser.parse_args()
    
    # Use the provided system prompt or the default
    system_prompt = args.system_prompt if args.system_prompt else DUCKDB_AGENT_PROMPT`
      );
    }
  }

  // Enhance the prompt handling to include FlexTime context
  if (content.includes('prompt = args.prompt')) {
    content = content.replace(
      'prompt = args.prompt',
      'full_prompt = f"FlexTime Context:\\n{FLEXTIME_SYSTEM_PROMPT}\\n\\n{flextime_context if flextime_context else \"\"}\\n\\nUser Query:\\n{args.prompt}"\n    prompt = full_prompt'
    );
  }

  return content;
}

/**
 * Add FlexTime customizations to Polars agent
 * 
 * @param {string} content - Original agent content
 * @param {Object} customizations - Customization options
 * @returns {string} - Modified agent content
 */
function customizePolarsAgent(content, customizations) {
  // Similar to DuckDB but for Polars
  // Add FlexTime system prompt as a constant
  const importSection = "import os\nimport sys\nimport argparse\n";
  const newImports = "# FlexTime-specific imports\nimport json\nimport datetime\n";
  content = content.replace(importSection, importSection + newImports);

  // Add FlexTime system prompt
  const flexTimeSystemPrompt = `
# FlexTime system prompt - guides all agent behavior
FLEXTIME_SYSTEM_PROMPT = """${prompts.flexTime.systemPrompt.replace(/`/g, '\\`').replace(/"/g, '\\"')}"""

# Polars agent specific prompt
POLARS_AGENT_PROMPT = """${prompts.polars.systemPrompt.replace(/`/g, '\\`').replace(/"/g, '\\"')}"""
`;

  // Add the FlexTime system prompt after the imports
  const afterImports = content.indexOf('\n\n', content.indexOf('import'));
  content = content.slice(0, afterImports) + flexTimeSystemPrompt + content.slice(afterImports);

  // Enhance the main function to include system prompt parameter
  if (content.includes('def main():')) {
    const enhancedMain = `
def main():
    parser = argparse.ArgumentParser(description='Polars agent for CSV analysis')
    parser.add_argument('--system-prompt', type=str, help='Optional system prompt override')`;
    
    content = content.replace('def main():\n    parser = argparse.ArgumentParser', enhancedMain);
    
    // Add system prompt argument parsing
    if (content.includes('args = parser.parse_args()')) {
      content = content.replace(
        'args = parser.parse_args()',
        `args = parser.parse_args()
    
    # Use the provided system prompt or the default
    system_prompt = args.system_prompt if args.system_prompt else POLARS_AGENT_PROMPT`
      );
    }
  }

  // Enhance the prompt handling to include FlexTime context
  if (content.includes('prompt = args.prompt')) {
    content = content.replace(
      'prompt = args.prompt',
      'full_prompt = f"FlexTime Context:\\n{FLEXTIME_SYSTEM_PROMPT}\\n\\nUser Query:\\n{args.prompt}"\n    prompt = full_prompt'
    );
  }

  return content;
}

/**
 * Add FlexTime customizations to JQ agent
 * 
 * @param {string} content - Original agent content
 * @param {Object} customizations - Customization options
 * @returns {string} - Modified agent content
 */
function customizeJqAgent(content, customizations) {
  // Similar customization as above, but for JQ agent
  // Add FlexTime system prompt as a constant
  const importSection = "import os\nimport sys\nimport argparse\n";
  const newImports = "# FlexTime-specific imports\nimport json\nimport datetime\n";
  content = content.replace(importSection, importSection + newImports);

  // Add FlexTime system prompt
  const flexTimeSystemPrompt = `
# FlexTime system prompt - guides all agent behavior
FLEXTIME_SYSTEM_PROMPT = """${prompts.flexTime.systemPrompt.replace(/`/g, '\\`').replace(/"/g, '\\"')}"""

# JQ agent specific prompt
JQ_AGENT_PROMPT = """${prompts.jq.systemPrompt.replace(/`/g, '\\`').replace(/"/g, '\\"')}"""
`;

  // Add the FlexTime system prompt after the imports
  const afterImports = content.indexOf('\n\n', content.indexOf('import'));
  content = content.slice(0, afterImports) + flexTimeSystemPrompt + content.slice(afterImports);

  // Update main function to include FlexTime context
  if (content.includes('prompt = args.prompt')) {
    content = content.replace(
      'prompt = args.prompt',
      'full_prompt = f"FlexTime Context:\\n{FLEXTIME_SYSTEM_PROMPT}\\n\\nUser Query:\\n{args.prompt}"\n    prompt = full_prompt'
    );
  }

  return content;
}

/**
 * Add FlexTime customizations to Bash agent
 * 
 * @param {string} content - Original agent content
 * @param {Object} customizations - Customization options
 * @returns {string} - Modified agent content
 */
function customizeBashAgent(content, customizations) {
  // Similar customization as above, but for Bash agent
  // Add FlexTime system prompt as a constant
  const importSection = "import os\nimport sys\nimport argparse\n";
  const newImports = "# FlexTime-specific imports\nimport json\nimport datetime\n";
  content = content.replace(importSection, importSection + newImports);

  // Add FlexTime system prompt
  const flexTimeSystemPrompt = `
# FlexTime system prompt - guides all agent behavior
FLEXTIME_SYSTEM_PROMPT = """${prompts.flexTime.systemPrompt.replace(/`/g, '\\`').replace(/"/g, '\\"')}"""

# Bash agent specific prompt
BASH_AGENT_PROMPT = """${prompts.bash.systemPrompt.replace(/`/g, '\\`').replace(/"/g, '\\"')}"""
`;

  // Add the FlexTime system prompt after the imports
  const afterImports = content.indexOf('\n\n', content.indexOf('import'));
  content = content.slice(0, afterImports) + flexTimeSystemPrompt + content.slice(afterImports);

  // Update main function to include FlexTime context
  if (content.includes('prompt = args.prompt')) {
    content = content.replace(
      'prompt = args.prompt',
      'full_prompt = f"FlexTime Context:\\n{FLEXTIME_SYSTEM_PROMPT}\\n\\nUser Query:\\n{args.prompt}"\n    prompt = full_prompt'
    );
  }

  return content;
}

/**
 * Add FlexTime customizations to Scraper agent
 * 
 * @param {string} content - Original agent content
 * @param {Object} customizations - Customization options
 * @returns {string} - Modified agent content
 */
function customizeScraperAgent(content, customizations) {
  // Similar customization as above, but for Scraper agent
  // Add FlexTime system prompt as a constant
  const importSection = "import os\nimport sys\nimport argparse\n";
  const newImports = "# FlexTime-specific imports\nimport json\nimport datetime\n";
  content = content.replace(importSection, importSection + newImports);

  // Add FlexTime system prompt
  const flexTimeSystemPrompt = `
# FlexTime system prompt - guides all agent behavior
FLEXTIME_SYSTEM_PROMPT = """${prompts.flexTime.systemPrompt.replace(/`/g, '\\`').replace(/"/g, '\\"')}"""

# Scraper agent specific prompt
SCRAPER_AGENT_PROMPT = """${prompts.scraper.systemPrompt.replace(/`/g, '\\`').replace(/"/g, '\\"')}"""
`;

  // Add the FlexTime system prompt after the imports
  const afterImports = content.indexOf('\n\n', content.indexOf('import'));
  content = content.slice(0, afterImports) + flexTimeSystemPrompt + content.slice(afterImports);

  // Update main function to include FlexTime context
  if (content.includes('prompt = args.prompt')) {
    content = content.replace(
      'prompt = args.prompt',
      'full_prompt = f"FlexTime Context:\\n{FLEXTIME_SYSTEM_PROMPT}\\n\\nUser Query:\\n{args.prompt}"\n    prompt = full_prompt'
    );
  }

  return content;
}

/**
 * Add FlexTime customizations to Codebase agent
 * 
 * @param {string} content - Original agent content
 * @param {Object} customizations - Customization options
 * @returns {string} - Modified agent content
 */
function customizeCodebaseAgent(content, customizations) {
  // Similar customization as above, but for Codebase agent
  // Add FlexTime system prompt as a constant
  const importSection = "import os\nimport sys\nimport argparse\n";
  const newImports = "# FlexTime-specific imports\nimport json\nimport datetime\n";
  
  if (content.includes(importSection)) {
    content = content.replace(importSection, importSection + newImports);
  } else if (content.includes("import os")) {
    content = content.replace("import os", importSection + newImports);
  }

  // Add FlexTime system prompt
  const flexTimeSystemPrompt = `
# FlexTime system prompt - guides all agent behavior
FLEXTIME_SYSTEM_PROMPT = """${prompts.flexTime.systemPrompt.replace(/`/g, '\\`').replace(/"/g, '\\"')}"""

# This agent doesn't have a specific prompt in prompts.js, so using a default
CODEBASE_AGENT_PROMPT = """You are a codebase agent for FlexTime, the scheduling system for the Big 12 Conference.
Your role is to analyze and interact with the FlexTime codebase."""
`;

  // Add the FlexTime system prompt after the imports
  const afterImports = content.indexOf('\n\n', content.indexOf('import'));
  content = content.slice(0, afterImports) + flexTimeSystemPrompt + content.slice(afterImports);

  // Update main function to include FlexTime context if it exists
  if (content.includes('prompt = args.query')) {
    content = content.replace(
      'prompt = args.query',
      'full_prompt = f"FlexTime Context:\\n{FLEXTIME_SYSTEM_PROMPT}\\n\\nUser Query:\\n{args.query}"\n    prompt = full_prompt'
    );
  } else if (content.includes('query = args.query')) {
    content = content.replace(
      'query = args.query',
      'full_query = f"FlexTime Context:\\n{FLEXTIME_SYSTEM_PROMPT}\\n\\nUser Query:\\n{args.query}"\n    query = full_query'
    );
  }

  return content;
}

/**
 * Run a Python agent from the FlexTime agents directory
 * 
 * @param {string} agentFilename - Filename of the agent script
 * @param {Array<string>} args - Command line arguments to pass to the agent
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - Output from the agent
 */
async function runPythonAgent(agentFilename, args = [], options = {}) {
  try {
    const agentPath = path.join(config.agents.flextimeAgentsPath, agentFilename);
    
    // Check if agent exists
    if (!fs.existsSync(agentPath)) {
      throw new Error(`Agent not found: ${agentPath}`);
    }
    
    // Build the command
    const agentArgs = args.map(arg => {
      // Escape quotes in arguments
      if (typeof arg === 'string') {
        return `"${arg.replace(/"/g, '\\"')}"`;
      }
      return arg;
    }).join(' ');
    
    // Load environment variables from parent .env file
    const envCmd = 'export $(grep -v \'^#\' /Users/nickthequick/XII-OS/.env | xargs 2>/dev/null) && ';
    
    // Run the agent as a Python script
    const command = `${envCmd}python3 "${agentPath}" ${agentArgs}`;
    
    console.log(`Running Python agent: ${agentFilename}`);
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr && !options.ignoreErrors) {
      console.warn(`Python agent warnings/errors: ${stderr}`);
    }
    
    return stdout.trim();
  } catch (error) {
    console.error(`Error running Python agent ${agentFilename}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  duplicateAgent,
  initializeFlexTimeAgents,
  createCompassIntegrationAgent,
  createHeadCoachAgent,
  customizeAgent,
  runPythonAgent
}; 