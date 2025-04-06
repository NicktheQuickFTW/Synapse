/**
 * Server wrapper with error handling
 * This prevents the server from crashing due to unhandled exceptions
 */

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION] Server kept alive:');
  console.error(err);
  // No port fallback logic here
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n[UNHANDLED REJECTION] Server kept alive:');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.error('\n');
  // Keep running despite error
});

// Load environment variables
require('dotenv').config();

// Add memory usage monitoring
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  console.log(`Memory usage: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`);
}, 60000); // Log every minute

// Import and run the app
console.log('Starting application with error handling...');

// Import your app
const app = require('./app');

// Explicitly use port 3002
const PORT = 3002;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access the app at http://localhost:${PORT}`);
}); 