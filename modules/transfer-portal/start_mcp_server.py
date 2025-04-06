import os
import uvicorn
from dotenv import load_dotenv
from src.agents.transfer_portal_agent import BasketballTransferPortalAgent

# Load environment variables
load_dotenv()

def main():
    # Initialize the transfer portal agent
    agent = BasketballTransferPortalAgent()
    
    # Configure server settings
    host = os.getenv("MCP_HOST", "0.0.0.0")
    port = int(os.getenv("MCP_PORT", "8000"))
    reload = os.getenv("MCP_RELOAD", "false").lower() == "true"
    
    # Start the MCP server
    uvicorn.run(
        "src.agents.transfer_portal_agent:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )

if __name__ == "__main__":
    main() 