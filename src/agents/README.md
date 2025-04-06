# Basketball Transfer Portal System

This directory contains the components of a comprehensive basketball transfer portal data collection and integration system. The system collects data from multiple sources including official transfer portals and news/social media to provide a unified view of transfer activities.

## Components

### Base Components
- `base_agent.py` - Base class for all data collection agents
- `on3_agent.py` - Agent for collecting data from On3
- `rivals_agent.py` - Agent for collecting data from Rivals
- `sports247_agent.py` - Agent for collecting data from 247Sports
- `modules/transfer-portal/scripts/transfer_portal_agent.py` - Main agent for collecting transfer portal data

### Orchestration
- `transfer_portal_orchestrator.py` - Coordinates multiple source-specific agents and consolidates data
- `fastapi_orchestrator.py` - FastAPI wrapper around the orchestrator for simplified API access

### News and Social Media Integration
- `news_monitor_agent.py` - Agent for monitoring news and social media for transfer information
- `news_monitor_integration.py` - Integrates news monitoring with the transfer portal orchestrator

### Testing and Development
- `simple_orchestrator.py` - Simplified version for testing

## Architecture

The system follows a multi-layer architecture:

1. **Data Collection Layer**: Source-specific agents scrape data from various websites
2. **Orchestration Layer**: The orchestrator manages multiple agents and consolidates their data 
3. **Integration Layer**: The news monitor integration adds contextual data from news and social media
4. **API Layer**: FastAPI endpoints expose the combined data for clients

### News Integration Flow

The news monitoring integration enhances the transfer portal data with information from news sources and social media:

1. The regular transfer portal orchestrator collects and reconciles data from official transfer portals
2. The news monitor agent collects data from news sources and social media platforms
3. The news-enriched orchestrator combines both data sources to:
   - Add contextual information to known transfers (reasons, quotes, etc.)
   - Detect potential transfers before they appear in official portal data
   - Track coaching changes and other factors influencing transfer activity

## Usage

To run the complete system with news integration:

```bash
python src/scripts/run_news_enriched_portal.py
```

This will start a FastAPI server that exposes endpoints for both the transfer portal data and news-related information.

## API Endpoints

The API provides the following main endpoint groups:

- `/portal/*` - Transfer portal data endpoints
- `/news/*` - News and social media integration endpoints

For a complete list of endpoints, visit the `/docs` endpoint when the server is running.

## Configuration

Configuration for the system components is handled through:

1. Environment variables
2. Runtime parameters when creating agent instances
3. Configuration objects passed to the agents and orchestrator

## Dependencies

The system requires the following main dependencies:

- Python 3.8+
- FastAPI
- Uvicorn
- Playwright
- Pydantic
- Asyncio
- BeautifulSoup4
- Aiohttp

See `requirements.txt` at the project root for a complete list of dependencies. 

## Notion Integration

The system can automatically sync transfer portal data to a Notion database for easier viewing and sharing.

### Daily Scheduled Sync

A daily sync script is available to run the transfer portal agents once per day and push the collected data to Notion:

```bash
./modules/transfer-portal/scripts/daily_transfer_portal_sync.sh
```

You can set up a cron job to run this script automatically once per day. This will:

1. Run all transfer portal agents with news integration
2. Collect the latest data from all sources
3. Push the consolidated data to your configured Notion database

For detailed instructions on setting up the cron job, see `docs/cron_setup.md`.

### Configuration

The Notion integration requires:

1. A Notion integration configured in your XII-OS database
2. The correct database ID set in the integration settings
3. Proper permissions for the integration to access your Notion workspace

The sync process maps transfer portal fields to Notion database properties, allowing you to view and filter the data within Notion. 