import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# URLs
BASE_URL = "https://www.on3.com/transfer-portal/industry/basketball/"
TOP_PLAYERS_URL = "https://www.on3.com/transfer-portal/industry/basketball/?position=all&status=all&rating=all&class=all&order=rating"

ON3_BASE_URL = "https://www.on3.com/transfer-portal/industry/basketball/"
ON3_TOP_PLAYERS_URL = "https://www.on3.com/transfer-portal/industry/basketball/?position=all&status=all&rating=all&class=all&order=rating"

SPORTS247_BASE_URL = "https://247sports.com/college/transfer-portal/season/2025-basketball/transferportaltop/"
SPORTS247_TOP_PLAYERS_URL = "https://247sports.com/college/transfer-portal/season/2025-basketball/transferportaltop/"

RIVALS_BASE_URL = "https://n.rivals.com/transfer_tracker/basketball/2024"
RIVALS_TOP_PLAYERS_URL = "https://n.rivals.com/transfer_tracker/basketball/2024"

# Data source settings
USE_247SPORTS = os.getenv("USE_247SPORTS", "true").lower() == "true"
USE_ON3 = os.getenv("USE_ON3", "true").lower() == "true"
USE_RIVALS = os.getenv("USE_RIVALS", "true").lower() == "true"

# Firecrawl settings
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")
FIRECRAWL_API_URL = "https://34.174.117.42/v1"
FIRECRAWL_TIMEOUT = int(os.getenv("FIRECRAWL_TIMEOUT", "120"))  # seconds

# Cache settings
CACHE_EXPIRY = int(os.getenv("CACHE_EXPIRY", "3600"))  # 1 hour in seconds

# Database settings
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///transfer_portal.db")

# Notion settings
NOTION_API_KEY = os.getenv("NOTION_API_KEY")
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

# Server settings
MCP_HOST = os.getenv("MCP_HOST", "127.0.0.1")  # Changed to localhost only
MCP_PORT = int(os.getenv("MCP_PORT", "3000"))  # Changed to 3000
MCP_RELOAD = os.getenv("MCP_RELOAD", "false").lower() == "true"

# Logging settings
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Scraping settings
SCRAPING_TIMEOUT = int(os.getenv("SCRAPING_TIMEOUT", "120"))  # seconds
NAVIGATION_TIMEOUT = int(os.getenv("NAVIGATION_TIMEOUT", "120000"))  # milliseconds
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
RETRY_DELAY = int(os.getenv("RETRY_DELAY", "5"))  # seconds between retries
WAIT_FOR_SELECTOR_TIMEOUT = int(os.getenv("WAIT_FOR_SELECTOR_TIMEOUT", "30000"))  # milliseconds

# Browser settings
BROWSER_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-software-rasterizer'
]
VIEWPORT_WIDTH = 1920
VIEWPORT_HEIGHT = 1080
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" 