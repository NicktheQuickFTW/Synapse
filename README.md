# XII OS - Transfer Portal Dashboard

A comprehensive dashboard for managing and visualizing athletic transfer portal data.

## Project Structure

```
XII-OS/
├── client/                  # Frontend code
│   ├── src/
│   │   ├── components/      # React components
│   │   └── ...
│   ├── public/
│   └── vite.config.js
│
├── server/                  # Express backend code
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   ├── app.js
│   └── server.js
│
├── modules/                 # Core business logic modules
│   ├── transfer-portal/     # Transfer portal core functionality
│   │   ├── agents/          # Data collection agents
│   │   └── services/        # Business logic services
│
└── package.json            # Root package.json with scripts for all parts
```

## Getting Started

```bash
# Install all dependencies
npm run install:all

# Start development servers (client + server)
npm run dev

# Start only the backend server
npm run server

# Start only the frontend client
npm run client

# Build the frontend for production
npm run build

# Start the production server (after building)
npm start
```

## Technology Stack

### Frontend
- React
- Material UI
- Recharts for data visualization
- Vite for build tooling

### Backend
- Node.js
- Express
- PostgreSQL
- Knex for database queries

### Data Collection
- Python
- Beautiful Soup
- Requests

## Documentation

Each directory contains its own README with more specific information:

- [Client Documentation](./client/README.md)
- [Server Documentation](./server/README.md)
- [Transfer Portal Module Documentation](./modules/transfer-portal/README.md) 