# Synapse

Core repository for XII-OS, containing the Synapse integration layer and all component modules. This repository serves as the central hub for managing and integrating various XII-OS components.

## Project Structure

```
synapse/
├── src/                    # Core Synapse integration layer
│   ├── components/        # React components
│   ├── pages/            # Page components
│   └── shared/           # Shared utilities and hooks
│
├── server/                # Backend services
│   ├── routes/           # API routes
│   ├── models/           # Data models
│   ├── controllers/      # Business logic
│   └── services/         # Shared services
│
├── modules/              # XII-OS component modules
│   ├── xii-agents/      # Agent system for data collection
│   ├── xii-core-db/     # Core database schemas and migrations
│   ├── xii-os-core-db/  # OS-specific database extensions
│   └── xii-os-supabase-db/ # Supabase integration
│
├── docs/                 # Documentation
│   ├── architecture/    # System architecture docs
│   ├── api/            # API documentation
│   ├── database/       # Database schemas and models
│   ├── deployment/     # Deployment guides
│   └── development/    # Development guides
│
├── config/              # Configuration files
├── scripts/             # Utility scripts
└── tests/              # Test suites
```

## Getting Started

```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev

# Start only the backend server
npm run server

# Start only the frontend
npm run client

# Build for production
npm run build
```

## Technology Stack

### Frontend
- React with Vite
- Material UI
- Recharts for data visualization

### Backend
- Node.js
- Express
- PostgreSQL with Knex
- DuckDB for analytics

### Integration Layer
- Custom agent system
- Event-driven architecture
- Modular component system

## Documentation

Comprehensive documentation is available in the `docs` directory:

### Architecture
- [System Architecture](docs/architecture/README.md)
- [Module Integration](docs/architecture/modules/README.md)
- [Synapse Core](docs/architecture/modules/synapse.md)

### Development
- [Getting Started](docs/getting-started/README.md)
- [API Documentation](docs/api/README.md)
- [Database Schema](docs/database/README.md)
- [AI Integration](docs/development/ai-integration.md)

### Deployment
- [Deployment Guide](docs/deployment/README.md)
- [Monitoring](docs/monitoring/README.md)
- [Security](docs/security/README.md)

## Contributing

Please read our [Contributing Guide](docs/development/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 