require('dotenv').config();
const path = require('path');
const dbConnection = require('./connection');

// Initialize database connection
dbConnection.initialize().catch(error => {
  console.error('Failed to initialize database connection:', error);
  process.exit(1);
});

// Export the Knex instance for query building
const knex = dbConnection.getKnex();

// Export migrations configuration
knex.migrate = {
  directory: path.join(__dirname, 'migrations'),
  tableName: 'knex_migrations'
};

module.exports = knex; 