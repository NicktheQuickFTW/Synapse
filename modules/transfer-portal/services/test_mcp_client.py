import asyncio
from src.mcp.client import MCPClient

async def query_transfer_portal():
    # Connect to the MCP server using configuration
    client = await MCPClient.connect_from_config("basketball_transfer_portal")
    
    try:
        # Example 1: Get all transfer portal data
        print("\n=== Full Transfer Portal Dataset ===")
        result = await client.tools().get_transfer_portal_data()
        print(f"Total players: {len(result['players'])}")
        
        # Example 2: Query for guards with at least 15 ppg
        print("\n=== Guards with 15+ PPG ===")
        result = await client.tools().query_players(
            position="G",
            min_ppg=15.0,
            limit=10
        )
        
        for player in result["players"]:
            print(f"\n{player['name']} - {player['position']}")
            print(f"Previous School: {player['previous_school']}")
            print(f"Status: {player['status']}")
            if player.get('destination_school'):
                print(f"Destination: {player['destination_school']}")
            if player.get('stats'):
                stats = player['stats']
                print("Stats:")
                if stats.get('ppg'): print(f"  PPG: {stats['ppg']}")
                if stats.get('rpg'): print(f"  RPG: {stats['rpg']}")
                if stats.get('apg'): print(f"  APG: {stats['apg']}")
                if stats.get('fg_pct'): print(f"  FG%: {stats['fg_pct']}")
                if stats.get('three_pt_pct'): print(f"  3PT%: {stats['three_pt_pct']}")
            if player.get('ranking'):
                print(f"Ranking: {player['ranking']}")
            if player.get('nil_valuation'):
                print(f"NIL Valuation: ${player['nil_valuation']:,.2f}")
            print("---")
        
        # Example 3: Force refresh the data
        print("\n=== Refreshing Data ===")
        refresh_result = await client.tools().refresh_data()
        print(f"Refresh status: {refresh_result['status']}")
        
        # Example 4: Search by school
        print("\n=== Players from Duke ===")
        result = await client.tools().query_players(
            school="Duke",
            limit=5
        )
        
        for player in result["players"]:
            print(f"{player['name']} - {player['position']} - {player['status']}")
            if player.get('destination_school'):
                print(f"  Destination: {player['destination_school']}")
            print("---")
    
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(query_transfer_portal()) 