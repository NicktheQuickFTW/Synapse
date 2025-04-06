/**
 * FlexTime Scheduling Engine - Claude AI Adapter
 * 
 * Uses Claude AI to analyze and suggest improvements for schedules
 */

const winston = require('winston');
const claudeAI = require('../../claude-ai');
const { AnthropicClient } = require('@anthropic-ai/sdk');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'flextime-claude-adapter' },
  transports: [
    new winston.transports.File({ filename: 'logs/flextime-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/flextime-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

/**
 * Analyze a schedule and provide improvement suggestions
 * @param {Object} schedule - Schedule to analyze
 * @param {Object} metrics - Schedule metrics
 * @returns {Promise<Object>} Analysis and suggestions
 */
exports.analyzeSchedule = async (schedule, metrics) => {
  logger.info('Analyzing schedule with Claude AI');
  
  try {
    const simplifiedSchedule = simplifyScheduleForAnalysis(schedule, metrics);
    
    // Construct prompt for Claude
    const prompt = createClaudePrompt(simplifiedSchedule);
    
    // Get analysis from Claude
    const response = await claudeAI.getCompletion({
      prompt,
      max_tokens: 2000,
      temperature: 0.2,
      model: "claude-3-opus-20240229" // Use latest Claude model
    });
    
    // Parse and format the response
    const analysis = parseClaudeResponse(response);
    
    logger.info('Schedule analysis complete', {
      suggestionsCount: analysis.suggestions.length
    });
    
    return {
      success: true,
      analysis
    };
    
  } catch (error) {
    logger.error('Error analyzing schedule with Claude', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate optimization parameters using Claude AI
 * @param {Object} schedule - Constrained schedule
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Optimization suggestions from Claude
 */
exports.generateOptimizationParameters = async (schedule, config) => {
  logger.info('Generating optimization parameters with Claude AI', { sport: config.sport });
  
  try {
    // Initialize Anthropic client
    const client = new AnthropicClient(process.env.ANTHROPIC_API_KEY);
    
    // Build a prompt based on schedule and config
    const prompt = buildOptimizationPrompt(schedule, config);
    
    // Call Claude
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
      system: CLAUDE_SYSTEM_PROMPT,
      temperature: 0.2
    });
    
    // Parse and process Claude's response
    const parameters = processClaudeResponse(response.content);
    
    return {
      success: true,
      parameters
    };
  } catch (error) {
    logger.error('Error generating optimization parameters with Claude AI', { error });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate clustering analysis using Claude AI
 * @param {Array} clusters - Team clusters
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Clustering analysis from Claude
 */
exports.generateClusteringAnalysis = async (clusters, config) => {
  logger.info('Generating clustering analysis with Claude AI', { 
    sport: config.sport,
    clusterCount: clusters.length
  });
  
  try {
    // Initialize Anthropic client
    const client = new AnthropicClient(process.env.ANTHROPIC_API_KEY);
    
    // Build a prompt for clustering analysis
    const prompt = buildClusteringAnalysisPrompt(clusters, config);
    
    // Call Claude
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
      system: CLAUDE_SYSTEM_PROMPT,
      temperature: 0.2
    });
    
    // Process Claude's response
    const analysis = {
      text: response.content[0].text,
      recommendations: extractClusteringRecommendations(response.content[0].text)
    };
    
    return {
      success: true,
      analysis
    };
  } catch (error) {
    logger.error('Error generating clustering analysis with Claude AI', { error });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Validate configuration and provide suggestions
 * @param {Object} config - Configuration to validate
 * @returns {Promise<Object>} Validation results and suggestions
 */
exports.validateConfiguration = async (config) => {
  logger.info('Validating configuration with Claude AI');
  
  try {
    // Extract relevant parts of config for validation
    const simplifiedConfig = {
      sport: config.sport,
      seasonStart: config.seasonStart,
      seasonEnd: config.seasonEnd,
      championshipDate: config.championshipDate,
      competitionFormat: config.competitionFormat,
      gamesPerTeam: config.gamesPerTeam,
      teamsCount: config.teams.length,
      teams: config.teams.map(t => t.name),
      constraintsCount: (config.institutionalConstraints || []).length
    };
    
    // Construct prompt for Claude
    const prompt = createValidationPrompt(simplifiedConfig);
    
    // Get validation from Claude
    const response = await claudeAI.getCompletion({
      prompt,
      max_tokens: 1000,
      temperature: 0.1,
      model: "claude-3-opus-20240229"
    });
    
    // Parse and format the response
    const validation = parseValidationResponse(response);
    
    logger.info('Configuration validation complete', {
      valid: validation.valid,
      suggestionsCount: validation.suggestions.length
    });
    
    return {
      success: true,
      validation
    };
    
  } catch (error) {
    logger.error('Error validating configuration', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Simplify a schedule for Claude analysis
 * @param {Object} schedule - Full schedule
 * @param {Object} metrics - Optional metrics
 * @returns {Object} Simplified schedule representation
 */
function simplifyScheduleForAnalysis(schedule, metrics = null) {
  // Count games by team
  const teamGameCounts = {};
  const teamHomeGames = {};
  const teamAwayGames = {};
  
  // Initialize
  schedule.weeks.forEach(week => {
    week.matchups.forEach(matchup => {
      // Home team
      if (!teamGameCounts[matchup.homeTeam]) {
        teamGameCounts[matchup.homeTeam] = 0;
        teamHomeGames[matchup.homeTeam] = 0;
        teamAwayGames[matchup.homeTeam] = 0;
      }
      teamGameCounts[matchup.homeTeam]++;
      teamHomeGames[matchup.homeTeam]++;
      
      // Away team
      if (!teamGameCounts[matchup.awayTeam]) {
        teamGameCounts[matchup.awayTeam] = 0;
        teamHomeGames[matchup.awayTeam] = 0;
        teamAwayGames[matchup.awayTeam] = 0;
      }
      teamGameCounts[matchup.awayTeam]++;
      teamAwayGames[matchup.awayTeam]++;
    });
  });
  
  // Create a simpler representation for analysis
  return {
    sport: schedule.sport,
    format: schedule.format,
    seasonStart: schedule.seasonStart,
    seasonEnd: schedule.seasonEnd,
    weeksCount: schedule.weeks.length,
    totalGames: schedule.weeks.reduce((sum, week) => sum + week.matchups.length, 0),
    teamGames: teamGameCounts,
    teamHomeGames,
    teamAwayGames,
    metrics: metrics || schedule.metrics || {}
  };
}

/**
 * Create a prompt for Claude schedule analysis
 * @param {Object} schedule - Simplified schedule
 * @returns {string} Prompt for Claude
 */
function createClaudePrompt(schedule) {
  return `
You are an expert sports scheduling consultant analyzing a ${schedule.sport} schedule for the Big 12 Conference. 
Please analyze this schedule and provide insights and improvement suggestions.

SCHEDULE INFORMATION:
- Sport: ${schedule.sport}
- Format: ${schedule.format}
- Season: ${new Date(schedule.seasonStart).toLocaleDateString()} to ${new Date(schedule.seasonEnd).toLocaleDateString()}
- Total Weeks: ${schedule.weeksCount}
- Total Games: ${schedule.totalGames}

TEAM GAMES DISTRIBUTION:
${Object.entries(schedule.teamGames).map(([team, count]) => 
  `- ${team}: ${count} games (${schedule.teamHomeGames[team]} home, ${schedule.teamAwayGames[team]} away)`
).join('\n')}

${schedule.metrics.travel ? `TRAVEL METRICS:
${Object.entries(schedule.metrics.travel.consecutiveAwayGames).map(([team, count]) => 
  `- ${team}: ${count} max consecutive away games`
).join('\n')}
` : ''}

${schedule.metrics.balance ? `BALANCE METRICS:
${Object.entries(schedule.metrics.balance.homeAwayBalance).map(([team, balance]) => 
  `- ${team}: ${(balance * 100).toFixed(1)}% home advantage`
).join('\n')}
` : ''}

${schedule.metrics.television ? `TV METRICS:
- Games in premium windows: ${schedule.metrics.television.gamesInPremiumWindows} (${schedule.metrics.television.premiumWindowPercentage.toFixed(1)}%)
- Weekend games: ${schedule.metrics.television.gameCounts.weekend}
- Primetime games: ${schedule.metrics.television.gameCounts.primetime}
` : ''}

Based on this information, please provide:
1. A brief overall assessment of the schedule quality
2. 3-5 specific suggestions for improvements
3. Any potential issues or conflicts that need to be addressed

Format your response as JSON with the following structure:
{
  "assessment": "Your overall assessment here",
  "suggestions": [
    {"issue": "Description of issue", "recommendation": "Specific recommendation"}
  ],
  "potentialConflicts": [
    "Description of potential conflict"
  ]
}
`;
}

/**
 * Parse Claude's response to extract structured analysis
 * @param {string} response - Claude's response
 * @returns {Object} Structured analysis
 */
function parseClaudeResponse(response) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if JSON not found - extract sections manually
    const assessment = extractSection(response, 'assessment', 'suggestions') || 
                      extractSection(response, 'Overall Assessment', 'Suggestions') ||
                      "Unable to extract assessment";
    
    const suggestionsText = extractSection(response, 'suggestions', 'potentialConflicts') || 
                           extractSection(response, 'Suggestions', 'Potential Conflicts') || 
                           "";
    const suggestions = suggestionsText.split(/\d+\./).filter(s => s.trim()).map(s => ({
      issue: s.trim(),
      recommendation: ""
    }));
    
    const conflictsText = extractSection(response, 'potentialConflicts', null) || 
                          extractSection(response, 'Potential Conflicts', null) || 
                          "";
    const conflicts = conflictsText.split(/\d+\./).filter(s => s.trim());
    
    return {
      assessment,
      suggestions,
      potentialConflicts: conflicts
    };
  } catch (error) {
    logger.error('Error parsing Claude response', { error: error.message });
    return {
      assessment: "Error analyzing schedule",
      suggestions: [
        { issue: "Unable to process analysis", recommendation: "Please try again" }
      ],
      potentialConflicts: []
    };
  }
}

/**
 * Build prompt for cluster analysis
 * @param {Array} clusters - Team clusters
 * @param {Object} config - Configuration object
 * @returns {string} Prompt for Claude
 */
function buildClusteringAnalysisPrompt(clusters, config) {
  // Format clusters for prompt
  const clusterDescriptions = clusters.map((cluster, index) => {
    const teamNames = cluster.map(team => team.name).join(', ');
    return `Cluster ${index + 1}: ${teamNames}`;
  }).join('\n');
  
  return `
# FlexTime Clustering Analysis Request

## Sport Details
- Sport: ${config.sport}
- Season: ${config.seasonStart.toISOString().split('T')[0]} to ${config.seasonEnd.toISOString().split('T')[0]}
- Conference: ${config.conference || 'Big 12'}
- Teams: ${config.teams.length}

## Current Clustering Configuration
${clusterDescriptions}

## Clustering Balance
- Travel Efficiency Weight: ${config.optimizationFactors?.travelEfficiency || 1.0}
- TV Revenue Weight: ${config.optimizationFactors?.tvRevenue || 1.0}
- Competitive Balance Weight: ${config.optimizationFactors?.competitiveBalance || 1.0}

## Special Considerations
${getSpecialConsiderationsText(config)}

## Requested Analysis
1. Analyze the effectiveness of the proposed clusters
2. Identify potential improvements to the clustering
3. Calculate the approximate travel savings
4. Suggest any adjustments to the cluster composition
5. Evaluate the impact on competition balance and TV opportunities
6. Provide concrete recommendations for optimizing the clusters

Please provide your analysis in a structured format with clear recommendations.
`;
}

/**
 * Get text for special considerations
 * @param {Object} config - Configuration object
 * @returns {string} Special considerations text
 */
function getSpecialConsiderationsText(config) {
  let text = '';
  
  // Add religious policies
  const religiousConstraints = config.constraints?.filter(c => 
    c.type === 'no_sunday_competition' || c.type === 'religious_policy'
  );
  
  if (religiousConstraints && religiousConstraints.length > 0) {
    text += '- Religious policies: ' + religiousConstraints.map(c => 
      `${c.teamId} (${c.description || 'No Sunday play'})`
    ).join(', ') + '\n';
  }
  
  // Add venue sharing
  const venueConstraints = config.constraints?.filter(c => c.type === 'venue_sharing');
  
  if (venueConstraints && venueConstraints.length > 0) {
    text += '- Venue sharing: ' + venueConstraints.map(c => 
      `${c.team1Id} and ${c.team2Id} (${c.venue || 'shared venue'})`
    ).join(', ') + '\n';
  }
  
  // Add high travel teams
  const highTravelTeams = ['west-virginia', 'byu']; // Example high-travel teams
  const configTeamIds = config.teams.map(t => t.id);
  const relevantHighTravelTeams = highTravelTeams.filter(id => configTeamIds.includes(id));
  
  if (relevantHighTravelTeams.length > 0) {
    text += '- High travel cost teams: ' + relevantHighTravelTeams.join(', ') + '\n';
  }
  
  return text || 'No special considerations specified.';
}

/**
 * Extract clustering recommendations from Claude response
 * @param {string} text - Claude response text
 * @returns {Array} List of recommendations
 */
function extractClusteringRecommendations(text) {
  // Look for a recommendations section
  const recommendationsMatch = text.match(/(?:recommendations|suggested improvements)[\s\S]*?(?=\n\n|$)/i);
  
  if (recommendationsMatch) {
    // Extract bullet points
    const recommendationsText = recommendationsMatch[0];
    const bulletPoints = recommendationsText.match(/[-*]\s+(.+?)(?=\n|$)/g);
    
    if (bulletPoints) {
      return bulletPoints.map(point => point.replace(/^[-*]\s+/, '').trim());
    }
  }
  
  // Fallback: try to find any numbered list
  const numberedListMatch = text.match(/\d+\.\s+(.+?)(?=\n\d+\.|$)/g);
  
  if (numberedListMatch) {
    return numberedListMatch.map(point => point.replace(/^\d+\.\s+/, '').trim());
  }
  
  // If nothing found, return empty array
  return [];
}

/**
 * Create a prompt for optimization parameters
 * @param {Object} schedule - Simplified schedule
 * @param {Object} config - Simplified configuration
 * @returns {string} Prompt for Claude
 */
function createOptimizationPrompt(schedule, config) {
  return `
You are an expert sports scheduling consultant for the Big 12 Conference. 
I need you to suggest optimization parameters for our ${schedule.sport} schedule.

CURRENT SCHEDULE INFO:
- Sport: ${schedule.sport}
- Format: ${schedule.format}
- Season: ${new Date(schedule.seasonStart).toLocaleDateString()} to ${new Date(schedule.seasonEnd).toLocaleDateString()}
- Total Games: ${schedule.totalGames}

CURRENT OPTIMIZATION FACTORS:
${Object.entries(config.currentOptimizationFactors).map(([factor, weight]) => 
  `- ${factor}: ${weight}`
).join('\n') || '- No current optimization factors set'}

Based on your expertise with ${schedule.sport} scheduling, suggest optimization factor weights for:
1. travelEfficiency - importance of minimizing travel distances
2. competitiveBalance - importance of balanced opponent distribution
3. tvRevenue - importance of games in premium TV windows
4. studentWellbeing - importance of academic considerations and recovery time

Provide values between 0.0 and 2.0 (higher = more important). Also suggest any sport-specific factors.

Format your response as JSON with the following structure:
{
  "optimizationFactors": {
    "travelEfficiency": 1.0,
    "competitiveBalance": 1.0,
    "tvRevenue": 1.0,
    "studentWellbeing": 1.0
  },
  "explanation": "Brief explanation of your reasoning",
  "additionalFactors": [
    {"name": "factorName", "weight": 1.0, "description": "What this factor represents"}
  ]
}
`;
}

/**
 * Parse Claude's optimization parameters response
 * @param {string} response - Claude's response
 * @returns {Object} Optimization parameters
 */
function parseOptimizationResponse(response) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback with default parameters
    return {
      optimizationFactors: {
        travelEfficiency: 1.0,
        competitiveBalance: 1.0,
        tvRevenue: 1.0,
        studentWellbeing: 1.0
      },
      explanation: "Using default optimization parameters",
      additionalFactors: []
    };
  } catch (error) {
    logger.error('Error parsing optimization response', { error: error.message });
    return {
      optimizationFactors: {
        travelEfficiency: 1.0,
        competitiveBalance: 1.0,
        tvRevenue: 1.0,
        studentWellbeing: 1.0
      },
      explanation: "Error processing parameters, using defaults",
      additionalFactors: []
    };
  }
}

/**
 * Create a prompt for configuration validation
 * @param {Object} config - Simplified configuration
 * @returns {string} Prompt for Claude
 */
function createValidationPrompt(config) {
  return `
You are an expert sports scheduling consultant for the Big 12 Conference.
Please validate this ${config.sport} scheduling configuration and provide suggestions.

CONFIGURATION:
- Sport: ${config.sport}
- Season: ${new Date(config.seasonStart).toLocaleDateString()} to ${new Date(config.seasonEnd).toLocaleDateString()}
- Championship Date: ${config.championshipDate ? new Date(config.championshipDate).toLocaleDateString() : 'Not specified'}
- Competition Format: ${config.competitionFormat}
- Games Per Team: ${config.gamesPerTeam}
- Teams Count: ${config.teamsCount}
- Teams: ${config.teams.join(', ')}
- Constraints Count: ${config.constraintsCount}

Based on your expertise with ${config.sport} scheduling, please:
1. Validate if this configuration is reasonable and feasible
2. Identify any potential issues or conflicts
3. Suggest improvements or adjustments

Format your response as JSON with the following structure:
{
  "valid": true/false,
  "issues": [
    "Description of issue"
  ],
  "suggestions": [
    "Suggestion for improvement"
  ]
}
`;
}

/**
 * Parse Claude's validation response
 * @param {string} response - Claude's response
 * @returns {Object} Validation results
 */
function parseValidationResponse(response) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if JSON not found
    const issuesText = extractSection(response, 'Issues', 'Suggestions') || "";
    const issues = issuesText.split(/\d+\./).filter(s => s.trim());
    
    const suggestionsText = extractSection(response, 'Suggestions', null) || "";
    const suggestions = suggestionsText.split(/\d+\./).filter(s => s.trim());
    
    return {
      valid: !response.toLowerCase().includes("not valid") && 
             !response.toLowerCase().includes("invalid") &&
             issues.length === 0,
      issues,
      suggestions
    };
  } catch (error) {
    logger.error('Error parsing validation response', { error: error.message });
    return {
      valid: true,
      issues: ["Error processing validation"],
      suggestions: ["Please review configuration manually"]
    };
  }
}

/**
 * Extract a section from text
 * @param {string} text - Full text
 * @param {string} sectionStart - Section start marker
 * @param {string} sectionEnd - Section end marker (optional)
 * @returns {string} Extracted section
 */
function extractSection(text, sectionStart, sectionEnd) {
  const startRegex = new RegExp(`${sectionStart}[:\\s]*(.*?)`, 'i');
  const startMatch = text.match(startRegex);
  
  if (!startMatch) return null;
  
  const startIndex = startMatch.index + startMatch[0].length;
  let endIndex = text.length;
  
  if (sectionEnd) {
    const endRegex = new RegExp(`${sectionEnd}[:\\s]*`, 'i');
    const endMatch = text.substring(startIndex).match(endRegex);
    if (endMatch) {
      endIndex = startIndex + endMatch.index;
    }
  }
  
  return text.substring(startIndex, endIndex).trim();
} 