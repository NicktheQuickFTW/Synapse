import aiohttp
import json
import os
from typing import Any, Dict, Optional, List
from datetime import datetime

class MCPServerConfig:
    def __init__(self, name: str, transport: str, url: str):
        self.name = name
        self.transport = transport
        self.url = url

    @classmethod
    def from_dict(cls, data: Dict[str, str]) -> 'MCPServerConfig':
        return cls(
            name=data["name"],
            transport=data["transport"],
            url=data["url"]
        )

class MCPClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.session: Optional[aiohttp.ClientSession] = None

    @classmethod
    async def connect(cls, url: str) -> 'MCPClient':
        client = cls(url)
        client.session = aiohttp.ClientSession()
        return client

    @classmethod
    async def connect_from_config(cls, server_name: str) -> 'MCPClient':
        """Connect to an MCP server using the configuration file."""
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'mcp_config.json')
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        server_config = next(
            (server for server in config["mcp_servers"] if server["name"] == server_name),
            None
        )
        
        if not server_config:
            raise ValueError(f"No MCP server configuration found for name: {server_name}")
        
        return await cls.connect(server_config["url"])

    async def close(self):
        if self.session:
            await self.session.close()

    async def tools(self) -> 'MCPTools':
        return MCPTools(self)

class MCPTools:
    def __init__(self, client: MCPClient):
        self.client = client

    async def query_players(
        self,
        position: Optional[str] = None,
        min_ppg: Optional[float] = None,
        school: Optional[str] = None,
        status: Optional[str] = None,
        limit: Optional[int] = 20,
        **kwargs
    ) -> Dict[str, Any]:
        """Query the transfer portal data with filters."""
        params = {
            "position": position,
            "min_ppg": min_ppg,
            "school": school,
            "status": status,
            "limit": limit
        }
        params.update(kwargs)

        async with self.client.session.get(
            f"{self.client.base_url}/players/search",
            params=params
        ) as response:
            if response.status != 200:
                raise Exception(f"Failed to query players: {await response.text()}")
            return {"players": await response.json()}

    async def refresh_data(self) -> Dict[str, Any]:
        """Force a refresh of the transfer portal data."""
        async with self.client.session.post(
            f"{self.client.base_url}/players/refresh"
        ) as response:
            if response.status != 200:
                raise Exception(f"Failed to refresh data: {await response.text()}")
            return await response.json()

    async def get_transfer_portal_data(self) -> Dict[str, Any]:
        """Get the full dataset of transfer portal players."""
        async with self.client.session.get(
            f"{self.client.base_url}/players"
        ) as response:
            if response.status != 200:
                raise Exception(f"Failed to get transfer portal data: {await response.text()}")
            return {"players": await response.json()} 