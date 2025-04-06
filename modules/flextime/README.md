# FlexTime Module

Sports scheduling system for Big 12 Athletics.

## Context Priming
> Read README.md, ai_docs/*, and run git ls-files to understand this codebase.

The FlexTime module is designed to manage, access, and store scheduling data for the XII-OS system.

## Purpose

FlexTime provides access to all scheduling-related data and offers a unified interface for:
- Reading schedule data from various formats (CSV, PDF, XLSX)
- Storing schedule modifications and preferences
- Managing conflicts and optimizations
- Integrating with calendar systems
- Accessing and utilizing all XII-OS agents and tools

## Directory Structure

```
flextime/
├── config/             # Configuration files
│   └── config.js       # Main configuration
├── data/               
│   ├── scheduling_data/ # Symlink to main XII-OS scheduling data
│   └── storage/        # FlexTime's own data storage
├── src/                # Source code
└── README.md           # This file
```

## Data Access

FlexTime has access to all scheduling data through a symbolic link to the main XII-OS scheduling directory structure:

- Core scheduling data
- Sport-specific scheduling for:
  - Baseball
  - Basketball
  - Gymnastics
  - Lacrosse
  - Soccer
  - Softball
  - Tennis
  - Volleyball
  - Wrestling

## Data Storage

FlexTime can store scheduling data in two ways:

1. **File-based storage** - Stored in the `data/storage` directory
2. **Database storage** - Using PostgreSQL tables with the following schema:
   - `flextime_schedules` - Modified schedule information
   - `flextime_conflicts` - Identified scheduling conflicts
   - `flextime_preferences` - User preferences for scheduling

## Agent Access

FlexTime provides seamless access to all XII-OS agents:

- **DuckDB Agent** - Natural language querying of database information
- **Polars CSV Agent** - Data analysis on CSV files using natural language
- **JQ Agent** - JSON processing through natural language
- **Bash Editor Agent** - Execute commands and edit files with natural language instructions
- **Codebase Context Agent** - Understand and analyze code repositories
- **Web Scraper Agent** - Extract data from web resources

## Tool Access

FlexTime integrates with various tools:

- **Direct DuckDB Access** - Run SQL queries against databases
- **Direct JQ Access** - Process JSON data with JQ expressions
- **Module Integration** - Connect with other XII-OS modules:
  - Compass
  - Transfer Portal
  - Athletic Competition
  - Weather Intelligence
  - Partnerships Optimization
  - Content Management
  - Notion Integration

## Integration

FlexTime is designed to work with other XII-OS components through standard APIs:
- Calendar integration
- Notification systems
- School branding for UI customization

## FlexTime System Prompt Integration

FlexTime has been enhanced with a comprehensive system prompt that provides detailed guidance for the scheduling system. The prompt defines FlexTime as an advanced sports scheduling intelligence system with a clear mission, execution process, and workflow phases.

The system prompt's structured approach includes:
- A 5-phase process from sport configuration to final output
- Prioritized constraint hierarchy
- Multi-factor optimization loops
- Comprehensive output formats and analytics

For details about the integration, see the [FlexTime System Prompt Integration](../../README-flextime-system-prompt.md) document.

## Getting Started

To use FlexTime in your XII-OS components:

```javascript
const flextime = require('../modules/flextime');

// Example: Get all basketball scheduling data
const basketballSchedules = flextime.getSchedules('basketball');

// Example: Check for conflicts
const conflicts = flextime.detectConflicts(newSchedule);

// Example: Store a modified schedule
flextime.storeSchedule(modifiedSchedule);

// Example: Use an agent to query the database
const result = await flextime.agents.runDuckDbAgent("List all conflicts in the baseball schedule");

// Example: Use a tool to run a direct DuckDB query
const queryResult = await flextime.tools.runDuckDbQuery("SELECT * FROM conflicts WHERE sport = 'baseball'");

// Example: Access another XII-OS module
const compassModule = flextime.tools.getXiiModule('compass');
``` 