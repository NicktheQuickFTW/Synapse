# XII-OS Core Database Module

A robust and type-safe PostgreSQL database module for XII-OS applications. This module provides connection pooling, transaction management, error handling, and a high-level query interface.

## Features

- **Connection Pooling**: Efficient management of database connections
- **Transaction Support**: ACID-compliant transaction handling with isolation level control
- **Type Safety**: Full TypeScript support with type inference
- **Error Handling**: Custom error types and detailed error information
- **Query Builder**: Convenient methods for common database operations
- **Logging**: Structured logging with Winston
- **Environment Configuration**: Easy configuration through environment variables
- **Retry Logic**: Automatic retry for transient failures

## Installation

```bash
npm install xii-core-db
```

## Configuration

Create a `.env` file based on the provided `.env.example`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
DB_SSL=false

# Connection Pool Settings
DB_POOL_MAX=20
DB_POOL_MIN=0
DB_POOL_IDLE_TIMEOUT=10000

# Timeouts (in milliseconds)
DB_CONNECTION_TIMEOUT=5000
DB_QUERY_TIMEOUT=10000

# Retry Settings
DB_MAX_RETRIES=3
DB_RETRY_DELAY=1000
```

## Usage

### Basic Query

```typescript
import { client } from 'xii-core-db';

async function getUser(id: number) {
  const result = await client.queryOne<User>('SELECT * FROM users WHERE id = $1', [id]);
  return result;
}
```

### Transactions

```typescript
import { client } from 'xii-core-db';

async function transferFunds(fromId: number, toId: number, amount: number) {
  return client.transaction(async (txClient) => {
    await txClient.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [amount, fromId]
    );
    
    await txClient.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [amount, toId]
    );
  }, {
    isolationLevel: 'SERIALIZABLE'
  });
}
```

### Batch Operations

```typescript
import { client } from 'xii-core-db';

async function createUsers(users: User[]) {
  const queries = users.map(user => ({
    text: 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    params: [user.name, user.email]
  }));
  
  return client.batch(queries);
}
```

### CRUD Operations

```typescript
import { client } from 'xii-core-db';

// Insert
const newUser = await client.insert('users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Update
const updatedUser = await client.update(
  'users',
  { name: 'Jane Doe' },
  { id: 1 }
);

// Delete
const deletedUser = await client.delete('users', { id: 1 });
```

### Error Handling

```typescript
import { client, errors } from 'xii-core-db';

try {
  await client.query('SELECT * FROM nonexistent_table');
} catch (error) {
  if (error instanceof errors.NotFoundError) {
    console.log('Table not found');
  } else if (error instanceof errors.ConnectionError) {
    console.log('Database connection failed');
  }
}
```

### Pool Management

```typescript
import { pool } from 'xii-core-db';

// Get pool statistics
const stats = pool.getStats();
console.log('Active connections:', stats.totalCount);
console.log('Idle connections:', stats.idleCount);
console.log('Waiting clients:', stats.waitingCount);

// Clean up
await pool.end();
```

## Development

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Build: `npm run build`

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific tests
npm test -- --grep "transaction"
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 