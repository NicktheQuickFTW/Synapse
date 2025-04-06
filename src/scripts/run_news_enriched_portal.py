#!/usr/bin/env python3
"""
Run script for the News-Enriched Transfer Portal Orchestrator

This script demonstrates how to set up and run the news-enriched 
transfer portal orchestrator with FastAPI integration.
"""

import asyncio
import logging
import os
import sys
import argparse
from pathlib import Path

# Add the project root to the path
script_dir = Path(os.path.dirname(os.path.abspath(__file__)))
project_root = script_dir.parent.parent
sys.path.insert(0, str(project_root))

# Import the orchestrator components
from fastapi import FastAPI
import uvicorn
from src.agents.news_monitor_integration import (
    NewsEnrichedOrchestrator,
    register_news_endpoints
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def run_once():
    """
    Run the orchestrator once to collect data and then exit.
    Useful for scheduled data collection.
    """
    logger.info("Running news-enriched transfer portal data collection (once)")
    
    # Create the enriched orchestrator
    orchestrator = NewsEnrichedOrchestrator(
        refresh_interval=int(os.environ.get("PORTAL_REFRESH_INTERVAL", "3600")),
        news_refresh_interval=int(os.environ.get("NEWS_REFRESH_INTERVAL", "1800"))
    )
    
    try:
        # Start the orchestrator
        await orchestrator.start()
        
        # Wait a bit for the initial data collection to complete
        logger.info("Waiting for data collection to complete...")
        await asyncio.sleep(20)  # Give time for initial data collection
        
        # Run a single refresh of all data sources
        logger.info("Refreshing all transfer portal data sources...")
        await orchestrator.refresh_all_agents()
        
        logger.info("Refreshing all news sources...")
        await orchestrator.news_agent.refresh_all_sources()
        
        # Integrate news data with transfer portal data
        logger.info("Integrating news data with transfer portal data...")
        await orchestrator._integrate_news_data()
        
        logger.info("Data collection completed successfully")
        
    finally:
        # Always stop the orchestrator
        await orchestrator.stop()


async def run_service():
    """Run the news-enriched transfer portal orchestrator service"""
    # Create FastAPI app
    app = FastAPI(
        title="Basketball Transfer Portal with News Integration",
        description="A comprehensive service that combines official transfer portal data with news and social media information",
        version="1.0.0"
    )
    
    # Create the enriched orchestrator
    logger.info("Initializing the news-enriched transfer portal orchestrator")
    orchestrator = NewsEnrichedOrchestrator(
        refresh_interval=int(os.environ.get("PORTAL_REFRESH_INTERVAL", "3600")),
        news_refresh_interval=int(os.environ.get("NEWS_REFRESH_INTERVAL", "1800"))
    )
    
    # Register news-specific endpoints
    register_news_endpoints(app, orchestrator)
    
    # Add documentation endpoints
    @app.get("/", tags=["docs"])
    async def root():
        """Root endpoint with documentation links"""
        return {
            "service": "Basketball Transfer Portal with News Integration",
            "documentation": "/docs",
            "openapi": "/openapi.json"
        }
    
    # Start the orchestrator in the background
    logger.info("Starting the orchestrator")
    await orchestrator.start()
    
    # Set up shutdown handler
    @app.on_event("shutdown")
    async def shutdown_event():
        """Gracefully shut down the orchestrator on application shutdown"""
        logger.info("Shutting down the orchestrator")
        await orchestrator.stop()
    
    # Get config from environment or use defaults
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "9000"))
    
    # Start the server
    logger.info(f"Starting FastAPI server on {host}:{port}")
    config = uvicorn.Config(app, host=host, port=port)
    server = uvicorn.Server(config)
    
    await server.serve()


def main():
    """Main entry point with exception handling"""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run the news-enriched transfer portal orchestrator")
    parser.add_argument("--run-once", action="store_true", help="Run data collection once and exit without starting the API server")
    args = parser.parse_args()
    
    try:
        if args.run_once:
            asyncio.run(run_once())
        else:
            asyncio.run(run_service())
    except KeyboardInterrupt:
        logger.info("Service stopped by user")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main()) 