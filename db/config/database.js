/**
 * Database Configuration for Neon
 */

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'xii-os',
      user: process.env.DB_USER || 'xii-os_owner',
      password: process.env.DB_PASSWORD || 'npg_4qYJFR0lneIg',
      ssl: {
        rejectUnauthorized: false
      }
    },
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      propagateCreateError: false
    },
    migrations: {
      directory: '../db/migrations'
    },
    seeds: {
      directory: '../db/seeds'
    }
  },
  
  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'xii-os',
      user: process.env.DB_USER || 'xii-os_owner',
      password: process.env.DB_PASSWORD || 'npg_4qYJFR0lneIg',
      ssl: {
        rejectUnauthorized: false
      }
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: '../db/migrations'
    }
  }
}; 