const knex = require('knex');
const { Pool } = require('pg');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.knex = null;
    this.maxRetries = 5;
    this.retryDelay = 1000; // 1 second
    this.connectionTimeout = 10000; // 10 seconds
  }

  async initialize() {
    try {
      // Initialize connection pool with optimized settings
      this.pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: {
          rejectUnauthorized: false
        },
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
        connectionTimeoutMillis: this.connectionTimeout,
        maxUses: 7500, // Close and replace a connection after it has been used 7500 times
        application_name: 'xii-os'
      });

      // Initialize Knex with the pool
      this.knex = knex({
        client: 'pg',
        connection: this.pool,
        pool: {
          min: 2,
          max: 10,
          acquireTimeoutMillis: this.connectionTimeout,
          createTimeoutMillis: this.connectionTimeout,
          destroyTimeoutMillis: this.connectionTimeout,
          idleTimeoutMillis: 30000,
          reapIntervalMillis: 1000,
          createRetryIntervalMillis: 100
        }
      });

      // Test the connection
      await this.testConnection();
      console.log('Database connection initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      throw error;
    }
  }

  async testConnection() {
    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        await this.knex.raw('SELECT 1');
        return true;
      } catch (error) {
        retries++;
        if (retries === this.maxRetries) {
          throw new Error(`Failed to connect to database after ${this.maxRetries} attempts`);
        }
        console.warn(`Connection attempt ${retries} failed, retrying in ${this.retryDelay}ms...`);
        await sleep(this.retryDelay * retries); // Exponential backoff
      }
    }
  }

  async getConnection() {
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      console.error('Failed to get database connection:', error);
      throw error;
    }
  }

  async releaseConnection(client) {
    try {
      await client.release();
    } catch (error) {
      console.error('Failed to release database connection:', error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.pool) {
        await this.pool.end();
      }
      if (this.knex) {
        await this.knex.destroy();
      }
      console.log('Database connections closed successfully');
    } catch (error) {
      console.error('Failed to close database connections:', error);
      throw error;
    }
  }

  // Get Knex instance for query building
  getKnex() {
    return this.knex;
  }

  // Get Pool instance for direct connection management
  getPool() {
    return this.pool;
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

// Handle process termination
process.on('SIGINT', async () => {
  await dbConnection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await dbConnection.close();
  process.exit(0);
});

module.exports = dbConnection; 