import sys
import json
# import sqlite3 # Use psycopg2 instead
import psycopg2
import psycopg2.extras # For dictionary cursor
import os
# import argparse # No longer needed
import pandas as pd
from pathlib import Path

def print_error(message):
    """Prints an error message to stderr and exits."""
    print(json.dumps({"error": message}), file=sys.stderr)
    sys.exit(1)

def print_debug(message):
    """Prints a debug message to stderr."""
    print(f"DEBUG: {message}", file=sys.stderr)

def get_db_connection():
    """Establishes connection to the PostgreSQL database."""
    try:
        db_name = os.environ.get('DB_NAME', 'xii_os_dev')
        user = os.environ.get('DB_USER', 'postgres')
        host = os.environ.get('DB_HOST', 'localhost')
        port = os.environ.get('DB_PORT', '5432')
        print_debug(f"Attempting PG connection: dbname={db_name} user={user} host={host} port={port}")
        conn = psycopg2.connect(
            dbname=db_name,
            user=user,
            password=os.environ.get('DB_PASSWORD', 'postgres'), # Avoid logging password
            host=host,
            port=port
            # Add sslmode if needed based on environment, e.g.:
            # sslmode='require' if os.environ.get('DB_SSL') == 'true' else 'prefer'
        )
        print_debug("PG connection successful.")
        return conn
    except psycopg2.OperationalError as e:
        print_error(f"PostgreSQL connection error: {e}")
    except Exception as e:
         print_error(f"An unexpected error occurred during DB connection: {e}")

def parse_schedule_to_matches(team_stats_list):
    """Parses the schedule JSON from multiple teams into a flat match list."""
    all_matches = []
    processed_match_ids = set() # To avoid duplicates if schedule appears for both teams

    for team_data in team_stats_list:
        team_name = team_data.get('team')
        # schedule data might be a dict/list directly if using jsonb in PG
        schedule_data = team_data.get('schedule') 
        if not team_name or not schedule_data:
            continue

        try:
            # If schedule_data isn't already parsed (depends on psycopg2 cursor),
            # load it. If it's already a dict/list, this won't hurt.
            if isinstance(schedule_data, str):
                 schedule = json.loads(schedule_data)
            else:
                 schedule = schedule_data # Assume already parsed by psycopg2 jsonb support
                 
            if not isinstance(schedule, list):
                print(f"Warning: Schedule for team {team_name} is not a list.", file=sys.stderr)
                continue 
                
            for match_info in schedule:
                if not isinstance(match_info, dict):
                    print(f"Warning: Match info for team {team_name} is not a dictionary.", file=sys.stderr)
                    continue
                # Attempt to extract details - adjust keys based on actual JSON structure
                opponent = match_info.get('opponent') 
                score_str = match_info.get('score') # e.g., "W 4-3" or "L 2-5"
                match_date = match_info.get('date')
                match_id_base = tuple(sorted((team_name, opponent))) + (match_date,)

                if not opponent or not score_str or not match_date or match_id_base in processed_match_ids:
                    continue 
                
                processed_match_ids.add(match_id_base)
                
                # Try to parse score into team1/team2 format (best effort)
                score_parts = score_str.split() # ["W", "4-3"] or ["L", "2-5"]
                final_score = "?-?"
                team1, team2 = team_name, opponent # Assume order initially
                if len(score_parts) == 2 and '-' in score_parts[1]:
                    final_score = score_parts[1]
                    # If lost, swap team order to match score perspective
                    if score_parts[0].upper() == 'L': 
                         team1, team2 = opponent, team_name 
                         s1, s2 = final_score.split('-')
                         final_score = f"{s2}-{s1}"

                match_unique_id = hash(match_id_base)

                all_matches.append({
                    "id": match_unique_id, # Placeholder ID
                    "team1": team1,
                    "team2": team2,
                    "score": final_score, 
                    "date": match_date
                })
        except json.JSONDecodeError:
            print(f"Warning: Could not decode schedule JSON for team {team_name}", file=sys.stderr)
            continue
        except Exception as e:
             print(f"Warning: Error processing schedule for team {team_name}: {e}", file=sys.stderr)
             continue
             
    all_matches.sort(key=lambda x: x.get('date', '0000-00-00'), reverse=True)
    print_debug(f"Parsed {len(all_matches)} matches from schedule JSON.")
    return all_matches

def get_data(data_type, gender):
    """Fetches tennis data from the PostgreSQL database."""
    conn = get_db_connection()
    if not conn:
         # Error already printed by get_db_connection
         sys.exit(1) 
         
    # Determine sport string based on gender - USING THE CORRECT FILTER
    sport_filter = 'womens-tennis' if gender == 'women' else 'mens-tennis' # Assuming mens-tennis for men
    print_debug(f"Fetching data type '{data_type}' for gender '{gender}' using sport filter '{sport_filter}'.")

    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor) 

        if data_type == 'matches':
            query = """
            SELECT team, schedule 
            FROM tennis_stats 
            WHERE sport = %s
            """
            cursor.execute(query, (sport_filter,))
            team_stats_list = [dict(row) for row in cursor.fetchall()]
            print_debug(f"Found {len(team_stats_list)} teams with sport='{sport_filter}' for match processing.")
            matches = parse_schedule_to_matches(team_stats_list)
            cursor.close()
            return {"matches": matches}

        elif data_type == 'standings':
            query = """
            SELECT 
                team, 
                wins, 
                losses, 
                conf_wins, 
                conf_losses, 
                win_percent, -- Overall win percent
                conf_win_percent,
                ita_rank, -- Add ita_rank if it exists in your table, otherwise default below
                streak -- Use 'streak' column based on schema
            FROM 
                tennis_stats 
            WHERE 
                sport = %s AND team IS NOT NULL AND team != ''
            ORDER BY 
                conf_rank ASC, conf_win_percent DESC, conf_wins DESC -- Keep existing sort
            """
            cursor.execute(query, (sport_filter,))
            # Fetch all necessary columns
            standings_raw = [dict(row) for row in cursor.fetchall()]
            print_debug(f"Found {len(standings_raw)} raw standings records with sport='{sport_filter}'.")
            cursor.close()
            
            # Prepare data in the format expected by JS tiebreaker
            standings = []
            for row in standings_raw:
                # Ensure numeric types and handle potential NULLs
                team_data = {
                    "team": row.get("team"),
                    "wins": int(row.get("wins", 0) or 0),
                    "losses": int(row.get("losses", 0) or 0),
                    "conf_wins": int(row.get("conf_wins", 0) or 0),
                    "conf_losses": int(row.get("conf_losses", 0) or 0),
                    "win_percent": float(row.get("win_percent", 0.0) or 0.0),
                    "conf_win_percent": float(row.get("conf_win_percent", 0.0) or 0.0),
                    "ita_rank": int(row.get("ita_rank")) if row.get("ita_rank") is not None else None, # Don't default to 999
                    "current_streak": str(row.get("streak", 0) or 0) # Map 'streak' to expected 'current_streak'
                 }
                # Only add if team name is valid
                if team_data["team"]:
                    standings.append(team_data)
                    
            # Return the detailed standings list
            return {"standings": standings}

        else:
            cursor.close()
            print_error(f"Invalid data type requested: {data_type}")

    except psycopg2.Error as e:
        # Catch specific PG errors if needed, e.g., psycopg2.errors.UndefinedTable
        print_error(f"PostgreSQL query error: {e}")
    except Exception as e:
        print_error(f"An unexpected error occurred during query: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":    
    input_data = None
    try:
        input_str = sys.stdin.read()
        if input_str:
            input_data = json.loads(input_str)
        else:
            print_error("No input data received via stdin.")
    except json.JSONDecodeError as e:
        print_error(f"Failed to decode JSON from stdin: {e}. Input was: {input_str}")
    except Exception as e:
         print_error(f"Error reading stdin: {e}")

    data_type = input_data.get('type')
    gender = input_data.get('gender')
    # db_path is no longer used directly for connection
    # db_path = input_data.get('db_path', 'db/tennis_data.db') 

    if not data_type or not gender:
         print_error("Missing required arguments in stdin JSON: type and gender")

    result = get_data(data_type, gender)
    print(json.dumps(result, default=str)) # Add default=str for potential date/time objects 