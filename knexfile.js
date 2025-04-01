/**
 * Database configuration for Knex
 */
module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'xii_os_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      connectionTimeout: 10000, // 10 seconds
      acquireConnectionTimeout: 10000 // 10 seconds
    },
    pool: {
      min: 0,
      max: 3,
      acquireTimeoutMillis: 10000,
      createTimeoutMillis: 10000,
      destroyTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './db/seeds'
    }
  },

  test: {
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.TEST_DB_NAME || 'xii_os_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      connectionTimeout: 10000,
      acquireConnectionTimeout: 10000
    },
    pool: {
      min: 0,
      max: 3,
      acquireTimeoutMillis: 10000,
      createTimeoutMillis: 10000,
      destroyTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './db/seeds/test'
    }
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      acquireConnectionTimeout: 10000
    },
    pool: {
      min: 0,
      max: 3,
      acquireTimeoutMillis: 10000,
      createTimeoutMillis: 10000,
      destroyTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './db/seeds/production'
    }
  }
}; 