# Tennis Tiebreaker Module

This module handles the tiebreaker functionality for tennis matches in the XII-OS platform.

## File Structure

```
tennis/
├── tennis_tiebreaker.js    # Main tiebreaker implementation
├── scripts/               # Utility scripts
│   ├── analyze_tennis_tiebreakers.js
│   ├── query_tennis_tiebreakers.js
│   └── create_tennis_tiebreaker_table.js
├── routes/               # API routes
│   └── tennis.js
├── components/          # UI components
│   └── TennisTiebreaker.js
└── README.md           # This documentation file
```

## Overview

The tennis tiebreaker module provides functionality for:
- Calculating tiebreaker scores
- Managing tiebreaker game states
- Handling tiebreaker-specific rules
- Processing tiebreaker data
- Database operations for tiebreaker rules
- API endpoints for tiebreaker operations
- UI components for tiebreaker visualization

## Components

### Core Implementation
- `tennis_tiebreaker.js`: Main implementation of tennis tiebreaker logic

### Scripts
- `analyze_tennis_tiebreakers.js`: Analyzes tiebreaker scenarios
- `query_tennis_tiebreakers.js`: Queries tiebreaker rules from database
- `create_tennis_tiebreaker_table.js`: Sets up database table for tiebreaker rules

### Routes
- `tennis.js`: API endpoints for tiebreaker operations

### Components
- `TennisTiebreaker.js`: React component for tiebreaker visualization

## Usage

```javascript
const TennisTiebreaker = require('./tennis_tiebreaker');

// Initialize a new tiebreaker
const tiebreaker = new TennisTiebreaker({
    matchId: 'match123',
    player1: { id: 'p1', name: 'Player 1' },
    player2: { id: 'p2', name: 'Player 2' }
});

// Process tiebreaker data
tiebreaker.processMatch(matchData);
```

## Database Schema

The module uses a `tennis_tiebreakers` table with the following structure:
- `name`: Name of the tiebreaker rule
- `description`: Description of the rule
- `details`: Detailed explanation
- `applies_to_mens`: Boolean for men's tennis
- `applies_to_womens`: Boolean for women's tennis
- `updated_at`: Last update timestamp

## API Endpoints

- `GET /tiebreakers/tennis`: Get tiebreaker UI
- `GET /api/tiebreaker/tennis`: Get tiebreaker data
- `POST /api/tiebreaker/tennis`: Process tiebreaker scenario

## Configuration

The tiebreaker can be configured with the following options:
- `matchId`: Unique identifier for the match
- `player1`: First player's information
- `player2`: Second player's information
- `settings`: Tiebreaker-specific settings

## Dependencies

- Node.js
- PostgreSQL
- React (for UI components)
- Express (for API routes)

## Related Modules

- Tennis Data Collection
- Tennis Match Processing
- Tennis Statistics
- Tennis Analytics

## Testing

Run the tiebreaker tests:
```bash
npm test tennis_tiebreaker
```

## Contributing

When adding new features or fixing bugs:
1. Update the documentation
2. Add appropriate tests
3. Follow the established code style
4. Update any related modules 