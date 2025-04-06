import { PoolClient } from 'pg';
import { QueryResult, QueryParams, TransactionOptions } from './types';
import pool from './pool';
import { createLogger } from './logger';

const logger = createLogger('client');

/**
 * Database client class providing high-level database operations
 */
export class DatabaseClient {
  private client: PoolClient | null = null;

  /**
   * Executes a single query
   * @param text SQL query text
   * @param params Query parameters
   * @returns Query result
   */
  async query<T = any>(text: string, params?: QueryParams): Promise<QueryResult<T>> {
    return pool.query<T>(text, params);
  }

  /**
   * Executes multiple queries in a transaction
   * @param callback Function containing the queries to execute
   * @param options Transaction options
   * @returns Result of the callback function
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const client = await pool.getClient();
    let result: T;

    try {
      await client.query('BEGIN');
      if (options.isolationLevel) {
        await client.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
      }

      logger.debug('Transaction started', { isolationLevel: options.isolationLevel });
      result = await callback(client);
      
      await client.query('COMMIT');
      logger.debug('Transaction committed');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back', { error: error.message });
      throw error;
    } finally {
      client.release();
    }

    return result;
  }

  /**
   * Executes multiple queries in batch
   * @param queries Array of queries to execute
   * @returns Array of query results
   */
  async batch<T = any>(
    queries: Array<{ text: string; params?: QueryParams }>
  ): Promise<QueryResult<T>[]> {
    return this.transaction(async (client) => {
      const results: QueryResult<T>[] = [];
      for (const query of queries) {
        const result = await client.query(query.text, query.params);
        results.push(result);
      }
      return results;
    });
  }

  /**
   * Executes a query that returns a single row
   * @param text SQL query text
   * @param params Query parameters
   * @returns Single row or null if not found
   */
  async queryOne<T = any>(text: string, params?: QueryParams): Promise<T | null> {
    const result = await this.query<T>(text, params);
    return result.rows[0] || null;
  }

  /**
   * Executes an insert query and returns the inserted row
   * @param table Table name
   * @param data Object containing column values
   * @returns Inserted row
   */
  async insert<T = any>(table: string, data: Record<string, any>): Promise<T> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`);

    const text = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await this.query<T>(text, values);
    return result.rows[0];
  }

  /**
   * Executes an update query and returns the updated row
   * @param table Table name
   * @param data Object containing column values to update
   * @param where Object containing where conditions
   * @returns Updated row
   */
  async update<T = any>(
    table: string,
    data: Record<string, any>,
    where: Record<string, any>
  ): Promise<T> {
    const setColumns = Object.keys(data);
    const whereColumns = Object.keys(where);
    const values = [...Object.values(data), ...Object.values(where)];

    let paramCount = 0;
    const setClause = setColumns
      .map((col) => `${col} = $${++paramCount}`)
      .join(', ');
    const whereClause = whereColumns
      .map((col) => `${col} = $${++paramCount}`)
      .join(' AND ');

    const text = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING *
    `;

    const result = await this.query<T>(text, values);
    return result.rows[0];
  }

  /**
   * Executes a delete query and returns the deleted row
   * @param table Table name
   * @param where Object containing where conditions
   * @returns Deleted row
   */
  async delete<T = any>(table: string, where: Record<string, any>): Promise<T> {
    const whereColumns = Object.keys(where);
    const values = Object.values(where);
    const whereClause = whereColumns
      .map((col, i) => `${col} = $${i + 1}`)
      .join(' AND ');

    const text = `
      DELETE FROM ${table}
      WHERE ${whereClause}
      RETURNING *
    `;

    const result = await this.query<T>(text, values);
    return result.rows[0];
  }
}

// Export a singleton instance
export const client = new DatabaseClient();
export default client; 