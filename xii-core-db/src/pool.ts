import { Pool, PoolClient } from 'pg';
import { DatabaseConfig, QueryResult, QueryParams } from './types';
import dbConfig, { validateConfig } from './config';
import { createLogger } from './logger';

const logger = createLogger('pool');

/**
 * A wrapper around pg.Pool that adds retry logic and enhanced error handling
 */
class DatabasePool {
  private pool: Pool;
  private config: DatabaseConfig;
  private retryCount: number = 0;

  constructor(config: DatabaseConfig = dbConfig) {
    validateConfig();
    this.config = config;
    this.pool = new Pool(config);

    // Handle pool errors
    this.pool.on('error', (err, client) => {
      logger.error('Unexpected error on idle client', { error: err.message });
    });

    // Log pool creation
    logger.info('Database pool created', {
      host: config.host,
      port: config.port,
      database: config.database,
      maxConnections: config.max
    });
  }

  /**
   * Executes a query with retry logic
   * @param text The SQL query text
   * @param params Query parameters
   * @returns Query result
   */
  async query<T = any>(text: string, params?: QueryParams): Promise<QueryResult<T>> {
    this.retryCount = 0;
    return this.executeWithRetry(async () => {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Query executed', {
        text,
        duration,
        rows: result.rowCount
      });

      return result;
    });
  }

  /**
   * Acquires a client from the pool for transaction execution
   * @returns A pooled client
   */
  async getClient(): Promise<PoolClient> {
    this.retryCount = 0;
    return this.executeWithRetry(async () => {
      const client = await this.pool.connect();
      logger.debug('Client acquired from pool');
      return client;
    });
  }

  /**
   * Executes a function with retry logic
   * @param operation The async operation to execute
   * @returns The operation result
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (this.retryCount < this.config.maxRetries && this.shouldRetry(error)) {
        this.retryCount++;
        logger.warn(`Retrying operation (attempt ${this.retryCount}/${this.config.maxRetries})`, {
          error: error.message
        });
        await this.delay(this.config.retryDelay);
        return this.executeWithRetry(operation);
      }
      throw error;
    }
  }

  /**
   * Determines if an error should trigger a retry
   * @param error The error to check
   * @returns True if the operation should be retried
   */
  private shouldRetry(error: any): boolean {
    const retryableCodes = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      '40001', // serialization failure
      '40P01'  // deadlock detected
    ];
    return retryableCodes.includes(error.code);
  }

  /**
   * Delays execution for a specified time
   * @param ms Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Returns pool statistics
   */
  getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }

  /**
   * Ends the pool and its clients
   */
  async end(): Promise<void> {
    await this.pool.end();
    logger.info('Database pool closed');
  }
}

// Export a singleton instance
export const pool = new DatabasePool();
export default pool; 