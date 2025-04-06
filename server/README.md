# XII OS Server

This directory contains the backend Express server for the XII OS Transfer Portal Dashboard.

## Directory Structure

- `routes/` - API routes
- `models/` - Database models
- `controllers/` - Route controllers
- `app.js` - Express application setup
- `server.js` - Server entry point

## Getting Started

```bash
# Install dependencies
npm install

# Start server in development mode
npm run dev

# Start server in production mode
npm start
```

## API Routes

- `/api/transfer-portal/stats` - Get transfer portal statistics
- `/api/transfer-portal` - Get transfer portal entries

## Technology Stack

- Express
- Node.js
- Knex (SQL query builder)
- PostgreSQL 