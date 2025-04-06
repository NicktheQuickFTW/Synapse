import { PoolConfig } from 'pg-pool';

/**
 * Database configuration options
 */
export interface DatabaseConfig extends PoolConfig {
  maxRetries?: number;
  retryDelay?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
  ssl?: boolean | {
    rejectUnauthorized: boolean;
    ca?: string;
    key?: string;
    cert?: string;
  };
}

/**
 * Query result with type safety
 */
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
  fields: FieldInfo[];
}

/**
 * Field information from query result
 */
export interface FieldInfo {
  name: string;
  tableID: number;
  columnID: number;
  dataTypeID: number;
  dataTypeSize: number;
  dataTypeModifier: number;
  format: string;
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  isolationLevel?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  readOnly?: boolean;
  deferrable?: boolean;
}

/**
 * Query parameters
 */
export type QueryParams = any[] | { [key: string]: any };

/**
 * Connection status
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

/**
 * Error codes
 */
export enum DatabaseErrorCode {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  QUERY_ERROR = 'QUERY_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  POOL_ERROR = 'POOL_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
} 