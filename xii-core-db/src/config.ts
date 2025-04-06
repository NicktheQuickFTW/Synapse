import { config } from 'dotenv';
import { DatabaseConfig } from './types';

// Load environment variables
config();

/**
 * Database configuration object derived from environment variables
 * with sensible defaults for development environments.
 */
export const dbConfig: DatabaseConfig = {
  // Connection settings
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  // Pool configuration
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  min: parseInt(process.env.DB_POOL_MIN || '0', 10),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '10000', 10),
  
  // Timeouts
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '10000', 10),
  
  // Retry settings
  maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000', 10),
  
  // SSL configuration
  ssl: process.env.DB_SSL === 'true' ? {
    ca: process.env.DB_SSL_CA,
    key: process.env.DB_SSL_KEY,
    cert: process.env.DB_SSL_CERT,
    rejectUnauthorized: true
  } : false
};

/**
 * Validates the database configuration
 * @throws {Error} if required configuration values are missing
 */
export function validateConfig(): void {
  const requiredFields = ['user', 'password', 'database'];
  const missingFields = requiredFields.filter(field => !dbConfig[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required database configuration: ${missingFields.join(', ')}`);
  }
  
  if (dbConfig.ssl && typeof dbConfig.ssl === 'object') {
    const sslFields = ['ca', 'key', 'cert'];
    const missingSslFields = sslFields.filter(field => !dbConfig.ssl[field]);
    
    if (missingSslFields.length > 0) {
      throw new Error(`SSL is enabled but missing required fields: ${missingSslFields.join(', ')}`);
    }
  }
}

export default dbConfig; 