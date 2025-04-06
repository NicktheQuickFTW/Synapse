#!/bin/bash

# Daily Transfer Portal Sync Script
# This script runs the transfer portal agents and then syncs the data to Notion
# Recommended to run this once per day via cron

# Set environment variables for daily refresh intervals (24 hours)
export PORTAL_REFRESH_INTERVAL=86400
export NEWS_REFRESH_INTERVAL=86400

# Set the path to the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "$(date): Starting daily transfer portal data collection..."

# Activate the virtual environment if it exists
if [ -d ".venv" ]; then
  source .venv/bin/activate
fi

# Run the transfer portal agents
echo "Running transfer portal agents..."
python src/scripts/run_news_enriched_portal.py --run-once

# Check if the agents ran successfully
if [ $? -eq 0 ]; then
  echo "Transfer portal data collection completed successfully."
  
  # Wait for 60 seconds to ensure all data is processed
  echo "Waiting for data processing to complete..."
  sleep 60
  
  # Sync the MBB portal data to Notion
  echo "Syncing MBB portal data to Notion..."
  node scripts/sync_notion_mbb.js to-notion
  
  if [ $? -eq 0 ]; then
    echo "MBB portal data sync to Notion completed successfully."
    
    # Sync the news data to Notion
    echo "Syncing news data to Notion..."
    node scripts/sync_notion_news.js to-notion
    
    if [ $? -eq 0 ]; then
      echo "News data sync to Notion completed successfully."
    else
      echo "WARNING: News data sync to Notion failed, but MBB portal data sync was successful."
      # Continue execution, don't exit with error
    fi
  else
    echo "ERROR: MBB portal data sync to Notion failed."
    exit 1
  fi
else
  echo "ERROR: Transfer portal data collection failed."
  exit 1
fi

echo "$(date): Daily transfer portal sync completed." 