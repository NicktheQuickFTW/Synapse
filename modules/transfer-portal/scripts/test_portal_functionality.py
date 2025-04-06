import asyncio
import json
from datetime import datetime
from src.mcp.client import MCPClient

async def test_transfer_portal():
    print("\n=== Basketball Transfer Portal Agent Test ===\n")
    
    try:
        # Connect to the MCP server
        print("Connecting to MCP server...")
        client = await MCPClient.connect_from_config("basketball_transfer_portal")
        tools = await client.tools()
        
        # Test 1: Get all transfer portal data
        print("\n1. Testing full data retrieval...")
        result = await tools.get_transfer_portal_data()
        print(f"Total players in portal: {len(result['players'])}")
        
        # Test 2: Search for high-scoring guards
        print("\n2. Testing search for guards with 15+ PPG...")
        guards = await tools.query_players(
            position="G",
            min_ppg=15.0,
            limit=5
        )
        print("\nTop 5 scoring guards:")
        for player in guards["players"]:
            print(f"\nName: {player['name']}")
            print(f"Position: {player['position']}")
            print(f"Previous School: {player['previous_school']}")
            if player.get('stats'):
                stats = player['stats']
                print("Statistics:")
                if stats.get('ppg'): print(f"  PPG: {stats['ppg']}")
                if stats.get('rpg'): print(f"  RPG: {stats['rpg']}")
                if stats.get('apg'): print(f"  APG: {stats['apg']}")
                if stats.get('fg_pct'): print(f"  FG%: {stats['fg_pct']}")
        
        # Test 3: Search by school
        print("\n3. Testing search by school (Duke)...")
        duke_players = await tools.query_players(
            school="Duke",
            limit=5
        )
        print("\nDuke transfer portal players:")
        for player in duke_players["players"]:
            print(f"\nName: {player['name']}")
            print(f"Position: {player['position']}")
            print(f"Status: {player['status']}")
            if player.get('destination_school'):
                print(f"Destination: {player['destination_school']}")
        
        # Test 4: Force data refresh
        print("\n4. Testing data refresh...")
        refresh_result = await tools.refresh_data()
        print(f"Refresh status: {refresh_result.get('status', 'unknown')}")
        
        # Test 5: Complex search (forwards with good shooting percentage)
        print("\n5. Testing search for forwards with good shooting percentage...")
        forwards = await tools.query_players(
            position="F",
            min_ppg=10.0,
            limit=5
        )
        print("\nTop 5 scoring forwards:")
        for player in forwards["players"]:
            print(f"\nName: {player['name']}")
            print(f"Position: {player['position']}")
            if player.get('stats'):
                stats = player['stats']
                print("Statistics:")
                if stats.get('ppg'): print(f"  PPG: {stats['ppg']}")
                if stats.get('fg_pct'): print(f"  FG%: {stats['fg_pct']}")
                if stats.get('three_pt_pct'): print(f"  3PT%: {stats['three_pt_pct']}")
        
    except Exception as e:
        print(f"\nError during testing: {str(e)}")
    finally:
        if 'client' in locals():
            await client.close()
            print("\nMCP client connection closed.")

if __name__ == "__main__":
    print("Starting transfer portal agent tests...")
    asyncio.run(test_transfer_portal()) 