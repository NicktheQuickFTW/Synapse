const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

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
    // Requesting women's matches from the Python bridge using POST and request body
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
app.get('/tiebreaker', async (req, res) => {
  logger.info('Fetching women\'s tiebreaker standings from database via Python bridge');
  try {
    const pythonBridgeUrl = `http://localhost:${process.env.PYTHON_BRIDGE_PORT || 3005}/python/exec`;
    const requestBody = {
      script: 'get_tennis_data.py',
      args: { type: 'standings', gender: 'women' }
    };
    // Requesting women's standings from the Python bridge using POST and request body
    const response = await axios.post(pythonBridgeUrl, requestBody);
    res.json({ standings: response.data.standings || [] });
  } catch (error) {
    logger.error(`Error fetching women\'s standings from Python bridge: ${error.response?.data?.error || error.message}`);
    res.status(500).json({ error: 'Failed to fetch women\'s standings' });
  }
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
    endpoints: ['/matches', '/tiebreaker', '/stats'],
    healthCheck: '/health'
  }).then(() => {
    logger.info('Registered with MCP server');
  }).catch(err => {
    logger.warn('Failed to register with MCP server', err.message);
  });
}); 