import { Pool } from 'pg';
import { DatabaseConfig, QueryResult, DatabaseErrorCode } from '../src/types';

describe('XII Core Database Tests', () => {
  let pool: Pool;
  const testConfig: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'test',
    password: process.env.DB_PASSWORD || 'test',
    database: process.env.DB_NAME || 'test',
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false,
    maxRetries: 3,
    retryDelay: 1000,
    connectionTimeout: 5000,
    queryTimeout: 10000
  };

  beforeAll(async () => {
    // Create a new pool for testing
    pool = new Pool(testConfig);
  });

  afterAll(async () => {
    // Clean up the pool after tests
    await pool.end();
  });

  describe('Connection Tests', () => {
    test('should connect to database successfully', async () => {
      const client = await pool.connect();
      expect(client).toBeDefined();
      client.release();
    });

    test('should handle connection errors gracefully', async () => {
      const badConfig = { ...testConfig, port: 1234 };
      const badPool = new Pool(badConfig);
      
      await expect(badPool.connect()).rejects.toThrow();
      await badPool.end();
    });
  });

  describe('Query Tests', () => {
    test('should execute simple query successfully', async () => {
      const result = await pool.query('SELECT NOW()');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].now).toBeDefined();
    });

    test('should handle parameterized queries', async () => {
      const result = await pool.query(
        'SELECT $1::text as message',
        ['Hello World']
      );
      expect(result.rows[0].message).toBe('Hello World');
    });

    test('should handle query errors', async () => {
      await expect(
        pool.query('SELECT * FROM nonexistent_table')
      ).rejects.toThrow();
    });
  });

  describe('Transaction Tests', () => {
    test('should handle transactions correctly', async () => {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Create a temporary test table
        await client.query(`
          CREATE TEMP TABLE test_table (
            id SERIAL PRIMARY KEY,
            value TEXT
          )
        `);
        
        // Insert some data
        await client.query(
          'INSERT INTO test_table (value) VALUES ($1)',
          ['test value']
        );
        
        // Verify the data
        const result = await client.query('SELECT * FROM test_table');
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].value).toBe('test value');
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    test('should rollback failed transactions', async () => {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Create a temporary test table
        await client.query(`
          CREATE TEMP TABLE test_table_2 (
            id SERIAL PRIMARY KEY,
            value TEXT NOT NULL
          )
        `);
        
        // This should fail due to NOT NULL constraint
        await client.query(
          'INSERT INTO test_table_2 (value) VALUES ($1)',
          [null]
        );
        
        await client.query('COMMIT');
        fail('Should have thrown an error');
      } catch (error) {
        await client.query('ROLLBACK');
        expect(error).toBeDefined();
      } finally {
        client.release();
      }
    });
  });

  describe('Pool Management Tests', () => {
    test('should handle multiple concurrent connections', async () => {
      const clients = await Promise.all([
        pool.connect(),
        pool.connect(),
        pool.connect()
      ]);
      
      try {
        const results = await Promise.all(
          clients.map(client => 
            client.query('SELECT pg_backend_pid()')
          )
        );
        
        // Verify we got different backend PIDs
        const pids = results.map(r => r.rows[0].pg_backend_pid);
        const uniquePids = new Set(pids);
        expect(uniquePids.size).toBe(clients.length);
      } finally {
        clients.forEach(client => client.release());
      }
    });

    test('should handle connection timeouts', async () => {
      const timeoutPool = new Pool({
        ...testConfig,
        connectionTimeoutMillis: 1
      });
      
      await expect(
        Promise.all(Array(100).fill(0).map(() => timeoutPool.connect()))
      ).rejects.toThrow();
      
      await timeoutPool.end();
    });
  });
}); 