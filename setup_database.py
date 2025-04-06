#!/usr/bin/env python
"""
Setup script for Supabase database tables
"""
import os
import psycopg2
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database connection details from Supabase URL
db_host = os.getenv("DB_HOST", "kxzhjhgiwvrnmpsxprmn.supabase.co") 
db_name = os.getenv("DB_NAME", "postgres")
db_user = os.getenv("DB_USER", "postgres")
db_password = os.getenv("DB_PASSWORD")
db_port = os.getenv("DB_PORT", "5432")

if not db_password:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    if not supabase_url or not supabase_key:
        print("Error: Missing database credentials in .env file")
        exit(1)
    print("Using Supabase service key as password")
    db_password = supabase_key

# Connect to the database
print(f"Connecting to PostgreSQL at {db_host}...")
try:
    conn = psycopg2.connect(
        host=db_host,
        database=db_name,
        user=db_user,
        password=db_password,
        port=db_port
    )
    conn.autocommit = True
    cursor = conn.cursor()
    print("Connected successfully!")
except Exception as e:
    print(f"Error connecting to database: {e}")
    exit(1)

# Read SQL from file
with open('site_pages.sql', 'r') as f:
    sql = f.read()

# Split SQL into individual commands
# We need to handle function definitions which contain semicolons
sql_commands = []
current_command = ""
in_function_def = False

for line in sql.split('\n'):
    line_stripped = line.strip()
    
    # Check if we're entering a function definition
    if "create function" in line_stripped.lower() or "create or replace function" in line_stripped.lower():
        in_function_def = True
    
    # Add line to current command
    current_command += line + "\n"
    
    # Check if we're exiting a function definition
    if in_function_def and line_stripped.endswith('$$;'):
        in_function_def = False
        sql_commands.append(current_command)
        current_command = ""
    # If not in a function and line ends with semicolon, it's a command boundary
    elif not in_function_def and line_stripped.endswith(';'):
        # Skip comments
        if not current_command.strip().startswith('--'):
            sql_commands.append(current_command)
        current_command = ""

# Execute each SQL command
for i, command in enumerate(sql_commands):
    if command.strip():
        print(f"Executing SQL command {i+1}/{len(sql_commands)}...")
        try:
            cursor.execute(command)
            print(f"Success: {command[:50].replace('\n', ' ')}...")
        except Exception as e:
            print(f"Error executing command: {e}")
            print(f"Command was: {command[:100].replace('\n', ' ')}...")

cursor.close()
conn.close()
print("Database setup complete!") 