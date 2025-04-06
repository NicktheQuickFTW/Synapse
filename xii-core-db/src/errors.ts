import { DatabaseErrorCode } from './types';

/**
 * Base class for database errors
 */
export class DatabaseError extends Error {
  public code: string;
  public detail?: string;
  public hint?: string;
  public position?: string;

  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Object.assign(this, details);

    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Error thrown when a connection cannot be established
 */
export class ConnectionError extends DatabaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, DatabaseErrorCode.CONNECTION_ERROR, details);
  }
}

/**
 * Error thrown when a query fails due to a constraint violation
 */
export class ConstraintViolationError extends DatabaseError {
  public constraint: string;
  public table: string;
  public column?: string;

  constructor(message: string, details?: Record<string, any>) {
    super(message, DatabaseErrorCode.CONSTRAINT_VIOLATION, details);
  }
}

/**
 * Error thrown when a query times out
 */
export class QueryTimeoutError extends DatabaseError {
  public query: string;
  public params?: any[];
  public duration: number;

  constructor(message: string, details?: Record<string, any>) {
    super(message, DatabaseErrorCode.QUERY_TIMEOUT, details);
  }
}

/**
 * Error thrown when a transaction fails
 */
export class TransactionError extends DatabaseError {
  public operation: string;
  public transactionId?: string;

  constructor(message: string, details?: Record<string, any>) {
    super(message, DatabaseErrorCode.TRANSACTION_ERROR, details);
  }
}

/**
 * Error thrown when a resource is not found
 */
export class NotFoundError extends DatabaseError {
  public resource: string;
  public identifier: any;

  constructor(message: string, details?: Record<string, any>) {
    super(message, DatabaseErrorCode.NOT_FOUND, details);
  }
}

/**
 * Error thrown when a duplicate key violation occurs
 */
export class DuplicateKeyError extends DatabaseError {
  public table: string;
  public column: string;
  public value: any;

  constructor(message: string, details?: Record<string, any>) {
    super(message, DatabaseErrorCode.DUPLICATE_KEY, details);
  }
}

/**
 * Converts a PostgreSQL error to a custom database error
 * @param error Original PostgreSQL error
 * @returns Custom database error
 */
export function convertError(error: any): DatabaseError {
  const details = {
    detail: error.detail,
    hint: error.hint,
    position: error.position
  };

  switch (error.code) {
    case '23505': // unique_violation
      return new DuplicateKeyError(error.message, {
        ...details,
        table: error.table,
        column: error.column,
        value: error.value
      });

    case '23503': // foreign_key_violation
    case '23514': // check_violation
      return new ConstraintViolationError(error.message, {
        ...details,
        constraint: error.constraint,
        table: error.table
      });

    case '57014': // query_canceled
      return new QueryTimeoutError(error.message, {
        ...details,
        query: error.query,
        params: error.params
      });

    case '25P02': // in_failed_sql_transaction
      return new TransactionError(error.message, {
        ...details,
        operation: 'ROLLBACK'
      });

    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
    case 'ENOTFOUND':
      return new ConnectionError(error.message, details);

    default:
      return new DatabaseError(error.message, error.code || 'UNKNOWN', details);
  }
}

export default {
  DatabaseError,
  ConnectionError,
  ConstraintViolationError,
  QueryTimeoutError,
  TransactionError,
  NotFoundError,
  DuplicateKeyError,
  convertError
}; 