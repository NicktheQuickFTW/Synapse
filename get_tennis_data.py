import sys
import json
import sqlite3
import argparse
import pandas as pd
from pathlib import Path

def get_data(db_path, data_type, gender):
    """Fetches tennis data (matches or standings) from the database."""
    if not Path(db_path).exists():
        return {"error": f"Database not found at {db_path}"}

    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        if data_type == 'matches':
            # Assuming a 'tennis_matches' table exists with relevant columns
            # Adjust the query based on your actual schema
            query = """
            SELECT 
                match_id as id, 
                team1, 
                team2, 
                team1_score || '-' || team2_score as score, 
                match_date as date
            FROM 
                tennis_matches 
            WHERE 
                gender = ? AND conference = 'Big 12' 
            ORDER BY 
                match_date DESC
            """
            cursor.execute(query, (gender,))
            columns = [description[0] for description in cursor.description]
            matches = [dict(zip(columns, row)) for row in cursor.fetchall()]
            return {"matches": matches}

        elif data_type == 'standings':
             # This calculation should ideally match the logic in your tiebreaker_app.py
             # For simplicity, let's just fetch basic win/loss for now.
             # You might need to call your tiebreaker logic here if it's complex.
            query = """
            SELECT 
                team, 
                SUM(CASE WHEN is_win = 1 THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN is_win = 0 THEN 1 ELSE 0 END) as losses,
                COUNT(*) as matches_played,
                CAST(SUM(CASE WHEN is_win = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) as win_percentage
            FROM (
                SELECT 
                    team1 as team, 
                    CASE WHEN team1_score > team2_score THEN 1 ELSE 0 END as is_win
                FROM tennis_matches
                WHERE gender = ? AND conference = 'Big 12'
                UNION ALL
                SELECT 
                    team2 as team, 
                    CASE WHEN team2_score > team1_score THEN 1 ELSE 0 END as is_win
                FROM tennis_matches
                WHERE gender = ? AND conference = 'Big 12'
            )
            GROUP BY team
            ORDER BY win_percentage DESC, wins DESC
            """
            cursor.execute(query, (gender, gender))
            columns = [description[0] for description in cursor.description]
            standings_raw = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            # Simple points assignment for frontend display (might not match official tiebreaker)
            standings = [{"team": row["team"], "points": int(row["win_percentage"] * 100) } for row in standings_raw] # Using win % as points for demo
            
            return {"standings": standings}

        else:
            return {"error": f"Invalid data type requested: {data_type}"}

    except sqlite3.Error as e:
        return {"error": f"Database error: {e}"}
    except Exception as e:
         return {"error": f"An unexpected error occurred: {e}"}
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Fetch tennis data from SQLite database.')
    parser.add_argument('--type', required=True, choices=['matches', 'standings'], help='Type of data to fetch.')
    parser.add_argument('--gender', required=True, choices=['men', 'women'], help='Gender for the data.')
    parser.add_argument('--db_path', default='db/tennis_data.db', help='Path to the SQLite database file.')
    
    # The python-bridge sends arguments as a JSON string via stdin
    input_data = json.loads(sys.stdin.read())
    
    args = parser.parse_args([]) # Create empty args object initially
    
    # Override args with values from stdin JSON
    args.type = input_data.get('type')
    args.gender = input_data.get('gender')
    args.db_path = input_data.get('db_path', 'db/tennis_data.db')

    if not args.type or not args.gender:
         print(json.dumps({"error": "Missing required arguments: type and gender"}))
         sys.exit(1)

    result = get_data(args.db_path, args.type, args.gender)
    print(json.dumps(result)) 