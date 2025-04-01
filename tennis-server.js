const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const knex = require('./src/db/knex');
// Import tiebreaker functions
const { applyTiebreakers, getHeadToHead } = require('./src/tiebreakers/tennis/tennis_tiebreaker');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'tennis-server' },
  transports: [
    new winston.transports.File({ filename: 'logs/tennis-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/tennis-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

// Make sure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Sample tennis match data
const matches = [
  { id: 1, team1: 'Texas', team2: 'Oklahoma', score: '4-3', date: '2025-03-20' },
  { id: 2, team1: 'Baylor', team2: 'TCU', score: '5-2', date: '2025-03-21' },
  { id: 3, team1: 'Kansas', team2: 'Kansas State', score: '6-1', date: '2025-03-22' },
];

// Initialize Express app
const app = express();

// Apply middleware with configured security settings
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'tennis',
    timestamp: new Date().toISOString(),
    metrics: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      matches: matches.length
    }
  });
});

// Tennis API endpoints
app.get('/matches', async (req, res) => {
  logger.info('Fetching women\'s matches from database via Python bridge');
  try {
    const pythonBridgeUrl = `http://localhost:${process.env.PYTHON_BRIDGE_PORT || 3005}/python/exec`;
    const requestBody = {
      script: 'get_tennis_data.py',
      args: { type: 'matches', gender: 'women' }
    };
    const response = await axios.post(pythonBridgeUrl, requestBody);
    res.json({ matches: response.data.matches || [] });
  } catch (error) {
    logger.error(`Error fetching women\'s matches from Python bridge: ${error.response?.data?.error || error.message}`);
    res.status(500).json({ error: 'Failed to fetch women\'s matches' });
  }
});

app.get('/matches/:id', (req, res) => {
  // Note: This endpoint might need adjustment if IDs differ between sample and db data
  const match = matches.find(m => m.id === parseInt(req.params.id)); // Still uses sample data for individual match lookup
  if (!match) {
    logger.warn(`Match not found: ${req.params.id}`);
    return res.status(404).json({ error: 'Match not found' });
  }
  logger.info(`Fetching match: ${req.params.id}`);
  res.json({ match });
});

app.post('/matches', (req, res) => {
  // Note: This endpoint interacts with the sample data array, not the database
  const { team1, team2, score, date } = req.body;
  if (!team1 || !team2 || !score) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const newMatch = {
    id: matches.length + 1,
    team1,
    team2,
    score,
    date: date || new Date().toISOString().split('T')[0]
  };
  
  matches.push(newMatch);
  logger.info(`Created new match: ${newMatch.id}`);
  res.status(201).json({ match: newMatch });
});

// Tiebreaker calculation endpoint
app.get('/standings', async (req, res) => {
  logger.info('Calculating women\'s tiebreaker standings');
  const sport = 'womens-tennis'; // Define sport
  try {
    // 1. Fetch basic standings data (including conf records) from Python script
    const pythonBridgeUrl = `http://localhost:${process.env.PYTHON_BRIDGE_PORT || 3005}/python/exec`;
    const standingsRequestBody = {
      script: 'get_tennis_data.py',
      // Fetch standings which includes conf records needed for tiebreaker input
      args: { type: 'standings', gender: 'women' } 
    };
    const standingsResponse = await axios.post(pythonBridgeUrl, standingsRequestBody);
    let teamsData = standingsResponse.data.standings; // This should be the list from python

    if (!teamsData || teamsData.length === 0) {
       logger.warn('No initial standings data received from Python bridge.');
       return res.json({ standings: [] }); // Return empty if no data
    }
    
    // 2. Fetch head-to-head data using JS function
    const headToHeadData = await getHeadToHead(sport);
    if (!headToHeadData) {
        logger.warn('Failed to get head-to-head data.');
        // Proceed without H2H? Or return error? For now, proceed.
    }

    // 3. Apply tiebreakers using JS function
    const finalStandings = applyTiebreakers(teamsData, headToHeadData);
    
    logger.info('Successfully calculated tiebreaker standings.');
    // Return the final, sorted standings. The format should match what the frontend expects.
    const displayStandings = finalStandings.map((team, index) => ({
        seed: team.seed || (index + 1), // Keep the calculated seed
        team: team.team,
        ita_rank: team.ita_rank,
        wins: team.wins,
        losses: team.losses,
        win_percentage: team.winPercent,
        confRecord: team.confRecord,
        tiebreaker: team.tiebreaker
    }));
    
    res.json({ standings: displayStandings });
    
  } catch (error) {
    logger.error(`Error calculating women\'s tiebreaker standings: ${error.response?.data?.error || error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to calculate tiebreaker standings' });
  }
});

// Keep the old endpoint for backward compatibility
app.get('/tiebreaker', (req, res) => {
  // Redirect to the new endpoint
  res.redirect('/standings');
});

// Stats endpoint
app.get('/stats', (req, res) => {
  // Generate some sample stats
  const stats = {
    totalMatches: matches.length,
    averageScore: '4-2',
    topTeam: 'Texas',
    lastUpdated: new Date().toISOString()
  };
  
  logger.info('Fetched tennis stats');
  res.json({ stats });
});

// Add route to serve the tiebreaker HTML
app.get('/tiebreakers/tennis', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tiebreaker.html'));
});

// Start the server
const PORT = process.env.TENNIS_PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Tennis service running on port ${PORT}`);
  
  // Register with MCP server
  const mcpHost = process.env.MCP_HOST || 'localhost';
  const mcpPort = process.env.MCP_PORT || 3002;
  
  axios.post(`http://${mcpHost}:${mcpPort}/register`, {
    name: 'tennis',
    host: 'localhost',
    port: PORT,
    endpoints: ['/matches', '/tiebreaker', '/stats']
  })
  .then(() => {
    logger.info('Successfully registered with MCP server');
  })
  .catch(error => {
    logger.warn(`Failed to register with MCP server: ${error.message}`);
    // Don't exit, just log the warning
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Don't exit, just log the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, just log the error
}); 