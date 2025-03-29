# Sport Metadata Schema Documentation

This document outlines the PostgreSQL schema additions for the sport metadata, basketball resources, and agent registry functionality.

## Schema Overview

The schema includes the following tables:

1. `sport_metadata` - Core information about different sports 
2. `basketball_resources` - Resource tracking for basketball games
3. `agent_registry` - Registry of AI agents with capabilities

## Table Details

### sport_metadata

Stores metadata about different sports.

| Column | Type | Description |
|--------|------|-------------|
| sport_id | SERIAL | Primary key |
| sport_name | VARCHAR(50) | Unique sport name |
| schema_version | VARCHAR(20) | Schema version for this sport |
| last_updated | TIMESTAMPTZ | Last update timestamp |
| claude_model_version | VARCHAR(20) | Claude model version used |

### basketball_resources

Tracks resources for basketball games. Extends the existing flextime_matchups table.

| Column | Type | Description |
|--------|------|-------------|
| game_id | UUID | Primary key |
| team_a | VARCHAR(50) | First team in the matchup |
| team_b | VARCHAR(50) | Second team in the matchup |
| net_impact | NUMERIC | NET impact value for the game |
| travel_miles | INTEGER | Travel miles for both teams |
| tv_slot | TIMESTAMPTZ | TV broadcast time slot |
| sport_id | INTEGER | Foreign key to sport_metadata |
| matchup_id | INTEGER | Foreign key to flextime_matchups |

### agent_registry

Registry of AI agents with their capabilities.

| Column | Type | Description |
|--------|------|-------------|
| agent_id | UUID | Primary key |
| sport_id | INTEGER | Foreign key to sport_metadata |
| last_ping | TIMESTAMPTZ | Last ping timestamp |
| capabilities | JSONB | Agent capabilities |
| agent_type | VARCHAR(50) | Type of agent |
| is_active | BOOLEAN | Whether agent is active |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Update timestamp |

## API Endpoints

### Sport Metadata

- `GET /api/athletic-competition/metadata/sports` - List all sports
- `POST /api/athletic-competition/metadata/sports` - Register a new sport

### Basketball Resources

- `GET /api/athletic-competition/resources/basketball` - List basketball games (with optional filters)
- `POST /api/athletic-competition/resources/basketball` - Register a new basketball game

### Agent Registry

- `GET /api/athletic-competition/agents` - List agents (with optional filters)
- `POST /api/athletic-competition/agents` - Register a new agent
- `PUT /api/athletic-competition/agents/:id/ping` - Update agent ping time

## Agent Registration Tools

The system includes two tools for registering agents:

### Automated Big 12 Agent Registration

This tool automatically registers specialized agents for all Big 12 sports:

```bash
npm run register-big12-agents
```

This will:
1. Register any missing Big 12 sports in the sport_metadata table
2. Create specialized agents for each sport with appropriate capabilities:
   - Scheduling agents for all sports
   - Analysis agents for all sports
   - Clustering agents for sports that require geographic optimization

### Manual Agent Registration Tool

This tool provides a command-line interface for manually registering agents:

```bash
npm run manual-register-agent
```

The tool will:
1. Show a list of available sports
2. Prompt for the sport ID
3. Show available agent types
4. Prompt for agent type
5. Show common capabilities
6. Allow entering custom capabilities
7. Register the agent in the database

## Usage Example

### Register a new sport

```javascript
const response = await fetch('/api/athletic-competition/metadata/sports', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sport_name: 'lacrosse',
    schema_version: '1.0.0',
    claude_model_version: 'claude-3-opus'
  })
});

const data = await response.json();
console.log(data);
```

### Register a basketball game

```javascript
const response = await fetch('/api/athletic-competition/resources/basketball', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    team_a: 'Kansas',
    team_b: 'BYU',
    net_impact: 2.5,
    travel_miles: 1200,
    tv_slot: '2025-12-28T18:00:00Z',
    sport_id: 1,  // Basketball sport ID
    matchup_id: 123  // Existing flextime matchup ID
  })
});

const data = await response.json();
console.log(data);
```

### Register an agent

```javascript
const response = await fetch('/api/athletic-competition/agents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sport_id: 1,  // Basketball sport ID
    capabilities: {
      clustering: true,
      scheduling: true,
      optimization: true,
      analysis: true
    },
    agent_type: 'scheduling'
  })
});

const data = await response.json();
console.log(data);
```

## Integration with FlexTime

This schema is designed to work seamlessly with the FlexTime scheduling engine. The `basketball_resources` table extends the `flextime_matchups` table, allowing additional basketball-specific metadata to be stored alongside the schedule.

The `agent_registry` table enables the FlexTime engine to use different AI agents with specialized capabilities for different sports, enhancing the scheduling process. 