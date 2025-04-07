const express = require('express');
const path = require('path');
const cors = require('cors');
const transferPortalRoutes = require('./src/routes/transfer_portal');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/transfer-portal-tracker', transferPortalRoutes);

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Export the app so server.js can use it
module.exports = app; 