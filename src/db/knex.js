require('dotenv').config();
const path = require('path');

const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false,
      ca: process.env.DB_SSL_CA,
      key: process.env.DB_SSL_KEY,
      cert: process.env.DB_SSL_CERT
    } : false
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: path.join(__dirname, 'migrations')
  }
});

// Test the database connection
knex.raw('SELECT 1')
  .then(() => {
    console.log('Database connection successful');
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error);
    console.error('Connection details:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL
    });
    process.exit(1);
  });

module.exports = knex; 