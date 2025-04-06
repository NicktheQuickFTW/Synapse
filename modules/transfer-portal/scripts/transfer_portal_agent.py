"""
Men's Basketball Transfer Portal Data Agent with MCP Integration

This implementation creates an agent that:
1. Scrapes men's basketball transfer portal data from on3.com
2. Processes and structures the data
3. Serves the data through a Model Context Protocol (MCP) server
4. Includes automatic refresh functionality to keep data current
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union

import aiohttp
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
BASE_URL = "https://www.on3.com/transfer-portal/wire/basketball/"
TOP_PLAYERS_URL = "https://www.on3.com/transfer-portal/industry/basketball/"
CACHE_EXPIRY = 60 * 60  # 1 hour in seconds

# Database setup
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Data models
class PlayerStats(BaseModel):
    ppg: Optional[float] = None  # Points per game
    rpg: Optional[float] = None  # Rebounds per game
    apg: Optional[float] = None  # Assists per game
    spg: Optional[float] = None  # Steals per game
    bpg: Optional[float] = None  # Blocks per game
    fg_pct: Optional[float] = None  # Field goal percentage
    three_pt_pct: Optional[float] = None  # 3-point percentage
    ft_pct: Optional[float] = None  # Free throw percentage

class TransferPlayer(BaseModel):
    name: str
    position: Optional[str] = None
    height: Optional[str] = None
    previous_school: Optional[str] = None
    class_year: Optional[str] = None
    eligibility: Optional[str] = None
    transfer_date: Optional[str] = None
    status: Optional[str] = None  # "committed", "in portal", etc.
    destination_school: Optional[str] = None
    stats: Optional[PlayerStats] = None
    ranking: Optional[int] = None
    profile_url: Optional[str] = None
    nil_valuation: Optional[str] = None

class TransferPortalData(BaseModel):
    last_updated: str
    players: List[TransferPlayer]

class TransferPortalQuery(BaseModel):
    position: Optional[str] = None
    min_ppg: Optional[float] = None
    school: Optional[str] = None
    status: Optional[str] = None
    limit: Optional[int] = 20

class BasketballTransferPortalAgent:
    """Agent for scraping and serving men's basketball transfer portal data"""
    
    def __init__(self):
        self.data_cache: Optional[TransferPortalData] = None
        self.last_refresh: Optional[float] = None
        self.db = SessionLocal()
        
    async def refresh_cache_if_needed(self):
        """Check if cache needs refreshing and refresh if necessary"""
        current_time = time.time()
        
        if (
            self.data_cache is None or 
            self.last_refresh is None or 
            current_time - self.last_refresh > CACHE_EXPIRY
        ):
            logger.info("Cache expired or not initialized. Refreshing data...")
            await self.refresh_data()
        else:
            logger.info("Using cached data")
    
    async def refresh_data(self):
        """Scrape fresh data from on3.com transfer portal"""
        logger.info("Starting data refresh from on3.com")
        
        players = []
        
        async with async_playwright() as p:
            # Launch browser in headless mode
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Configure page to avoid detection
            await page.set_extra_http_headers({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'sec-ch-ua': '"Not A;Brand";v="99", "Chromium";v="121"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"'
            })
            
            # First scrape the main transfer portal page
            await page.goto(BASE_URL, wait_until='networkidle')
            
            # Wait for player cards to load
            await page.wait_for_selector('.transfer-portal-card', timeout=30000)
            
            # Extract player data
            main_players = await self._extract_players_from_page(page)
            players.extend(main_players)
            
            # Then scrape the top players page for rankings and additional data
            await page.goto(TOP_PLAYERS_URL, wait_until='networkidle')
            
            # Wait for player cards to load
            await page.wait_for_selector('.transfer-portal-card', timeout=30000)
            
            # Extract top player data and merge with existing data
            top_players = await self._extract_players_from_page(page, include_ranking=True)
            
            # Merge top players with main list (update existing entries)
            players = self._merge_player_lists(players, top_players)
            
            # Close browser
            await browser.close()
        
        # Update cache
        self.data_cache = TransferPortalData(
            last_updated=datetime.now().isoformat(),
            players=players
        )
        self.last_refresh = time.time()
        
        # Sync to database
        await self._sync_to_database(players)
        
        logger.info(f"Data refresh complete. Collected {len(players)} players.")
        return self.data_cache
    
    async def _extract_players_from_page(self, page, include_ranking=False) -> List[TransferPlayer]:
        """Extract player data from the current page"""
        players = []
        
        # Get all player cards
        player_cards = await page.query_selector_all('.transfer-portal-card')
        
        for i, card in enumerate(player_cards):
            try:
                # Extract basic info
                name_element = await card.query_selector('.player-name')
                name = await name_element.text_content() if name_element else "Unknown"
                
                # Extract position, height, etc.
                details_element = await card.query_selector('.player-details')
                details_text = await details_element.text_content() if details_element else ""
                
                # Parse details
                position = None
                height = None
                class_year = None
                
                if details_text:
                    details_parts = details_text.split('•')
                    if len(details_parts) >= 1:
                        position = details_parts[0].strip()
                    if len(details_parts) >= 2:
                        height = details_parts[1].strip()
                    if len(details_parts) >= 3:
                        class_year = details_parts[2].strip()
                
                # Extract school info
                school_element = await card.query_selector('.player-school')
                previous_school = await school_element.text_content() if school_element else None
                
                # Extract stats if available
                stats_element = await card.query_selector('.player-stats')
                stats = PlayerStats()
                
                if stats_element:
                    stats_text = await stats_element.text_content()
                    stats_parts = stats_text.split('/')
                    
                    if len(stats_parts) >= 1 and 'ppg' in stats_parts[0]:
                        stats.ppg = float(stats_parts[0].replace('ppg', '').strip())
                    if len(stats_parts) >= 2 and 'rpg' in stats_parts[1]:
                        stats.rpg = float(stats_parts[1].replace('rpg', '').strip())
                    if len(stats_parts) >= 3 and 'apg' in stats_parts[2]:
                        stats.apg = float(stats_parts[2].replace('apg', '').strip())
                
                # Extract profile URL
                profile_link = await card.query_selector('a')
                profile_url = await profile_link.get_attribute('href') if profile_link else None
                
                # If this is the top players page, extract ranking
                ranking = None
                if include_ranking:
                    ranking_element = await card.query_selector('.player-ranking')
                    if ranking_element:
                        ranking_text = await ranking_element.text_content()
                        try:
                            ranking = int(ranking_text.strip().replace('#', ''))
                        except ValueError:
                            ranking = None
                
                # Create player object
                player = TransferPlayer(
                    name=name,
                    position=position,
                    height=height,
                    class_year=class_year,
                    previous_school=previous_school,
                    stats=stats,
                    ranking=ranking,
                    profile_url=profile_url
                )
                
                players.append(player)
                
            except Exception as e:
                logger.error(f"Error extracting player {i}: {str(e)}")
        
        return players
    
    def _merge_player_lists(self, main_list, top_list):
        """Merge the top players list into the main list, updating existing entries"""
        # Create a map of players by name for faster lookup
        player_map = {player.name: player for player in main_list}
        
        for top_player in top_list:
            if top_player.name in player_map:
                # Update existing player with any new information
                existing_player = player_map[top_player.name]
                
                # Only update fields that are not None in the top player
                for field, value in top_player.dict().items():
                    if value is not None:
                        setattr(existing_player, field, value)
            else:
                # Add new player to the list
                main_list.append(top_player)
        
        return main_list
    
    async def _sync_to_database(self, players: List[TransferPlayer]):
        """Sync player data to the database"""
        try:
            for player in players:
                query = text("""
                    INSERT INTO players (
                        name, position, height, previous_school,
                        eligibility, class_year, status, stats, metadata
                    ) VALUES (
                        :name, :position, :height, :previous_school,
                        :eligibility, :class_year, :status, :stats, :metadata
                    ) ON CONFLICT (name) DO UPDATE SET
                        position = EXCLUDED.position,
                        height = EXCLUDED.height,
                        previous_school = EXCLUDED.previous_school,
                        eligibility = EXCLUDED.eligibility,
                        class_year = EXCLUDED.class_year,
                        status = EXCLUDED.status,
                        stats = EXCLUDED.stats,
                        metadata = EXCLUDED.metadata,
                        updated_at = NOW()
                """)
                
                values = {
                    'name': player.name,
                    'position': player.position,
                    'height': player.height,
                    'previous_school': player.previous_school,
                    'eligibility': player.eligibility,
                    'class_year': player.class_year,
                    'status': player.status,
                    'stats': json.dumps(player.stats.dict() if player.stats else {}),
                    'metadata': json.dumps({
                        'transfer_date': player.transfer_date,
                        'destination_school': player.destination_school,
                        'ranking': player.ranking,
                        'profile_url': player.profile_url,
                        'nil_valuation': player.nil_valuation
                    })
                }
                
                self.db.execute(query, values)
            
            self.db.commit()
            logger.info("Successfully synced data to database")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to sync data to database: {str(e)}")
            raise
    
    async def query_players(self, query: TransferPortalQuery) -> List[TransferPlayer]:
        """Query the player database with filters"""
        await self.refresh_cache_if_needed()
        
        if not self.data_cache:
            return []
        
        filtered_players = self.data_cache.players
        
        # Apply filters if specified
        if query.position:
            filtered_players = [p for p in filtered_players if p.position and query.position.lower() in p.position.lower()]
        
        if query.school:
            filtered_players = [p for p in filtered_players if (
                (p.previous_school and query.school.lower() in p.previous_school.lower()) or
                (p.destination_school and query.school.lower() in p.destination_school.lower())
            )]
        
        if query.status:
            filtered_players = [p for p in filtered_players if p.status and query.status.lower() in p.status.lower()]
        
        if query.min_ppg is not None:
            filtered_players = [p for p in filtered_players if p.stats and p.stats.ppg and p.stats.ppg >= query.min_ppg]
        
        # Sort by ranking if available, otherwise by points per game
        filtered_players.sort(
            key=lambda p: (
                -(p.ranking or float('inf')),
                -(p.stats.ppg if p.stats and p.stats.ppg else 0)
            )
        )
        
        # Apply limit if specified
        if query.limit:
            filtered_players = filtered_players[:query.limit]
        
        return filtered_players

# Create FastAPI app for MCP server
app = FastAPI()
agent = BasketballTransferPortalAgent()

@app.on_event("startup")
async def startup_event():
    """Initialize the agent on startup"""
    await agent.refresh_data()

@app.get("/transfer_portal_data")
async def get_transfer_portal_data():
    """Get the complete transfer portal data"""
    await agent.refresh_cache_if_needed()
    
    if not agent.data_cache:
        raise HTTPException(status_code=500, detail="Failed to retrieve transfer portal data")
    
    return agent.data_cache.dict()

@app.post("/query_players")
async def query_players(query: TransferPortalQuery):
    """
    Query the transfer portal for players matching specific criteria
    
    Args:
        position: Filter by player position (e.g., "G", "F", "C", "PG", etc.)
        min_ppg: Minimum points per game
        school: Filter by previous or destination school
        status: Filter by player status (e.g., "committed", "in portal")
        limit: Maximum number of results to return (default: 20)
    
    Returns:
        List of players matching the criteria
    """
    players = await agent.query_players(query)
    return {"players": [p.dict() for p in players]}

@app.post("/refresh_data")
async def refresh_data():
    """
    Force a refresh of the transfer portal data
    
    Returns:
        Status message
    """
    await agent.refresh_data()
    return {
        "status": "success",
        "last_updated": agent.data_cache.last_updated,
        "player_count": len(agent.data_cache.players)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000) 