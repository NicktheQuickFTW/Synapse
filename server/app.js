const express = require('express');
const path = require('path');
const cors = require('cors');
const transferPortalRoutes = require('./routes/transfer_portal');
const githubRoutes = require('./routes/github');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the client build directory
app.use(express.static(path.join(__dirname, '../client/dist')));

// API Routes
app.use('/api/transfer-portal', transferPortalRoutes);
app.use('/api/github', githubRoutes);

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Export the app so server.js can use it
module.exports = app; 