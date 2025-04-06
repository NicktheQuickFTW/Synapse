# XII Synapse

The central management interface for the XII-OS ecosystem. This dashboard provides a unified way to manage modules, monitor system activity, and configure the platform.

## Features

- Module management (install, update, configure)
- System monitoring and analytics
- User administration
- Configuration management
- Integration with all XII-OS modules

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- XII-OS Core running

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Project Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable components
│   │   ├── common/      # Common UI components
│   │   ├── layout/      # Layout components
│   │   └── modules/     # Module-specific components
│   ├── context/         # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API and service functions
│   ├── store/           # State management
│   ├── styles/          # Global styles
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main app component
│   └── index.jsx        # Entry point
└── tests/               # Test files
```

## Configuration

The dashboard can be configured through environment variables:

```
VITE_API_URL=http://localhost:3000 # XII-OS API endpoint
VITE_AUTH_DOMAIN=synapse.xii-os.com   # Auth provider domain
```

## Contributing

Please see the [contributing guide](CONTRIBUTING.md) for details on how to contribute to the project.

## License

MIT 