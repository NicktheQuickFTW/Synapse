import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Source database connection
conn = psycopg2.connect(
    host=os.getenv('SOURCE_DB_HOST', '34.174.117.42'),
    port=int(os.getenv('SOURCE_DB_PORT', 5432)),
    user=os.getenv('SOURCE_DB_USER', 'postgres'),
    password=os.getenv('SOURCE_DB_PASSWORD', 'Conference12!'),
    database=os.getenv('SOURCE_DB_NAME', 'xii-os'),
    sslmode='require'
)

cur = conn.cursor()

# Tables to check
tables = ['wten_schedules', 'mbb_team_stats']

for table in tables:
    print(f"\nSchema for {table}:")
    cur.execute(f"""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = '{table}'
        ORDER BY ordinal_position;
    """)
    for row in cur.fetchall():
        print(row)
    
    print(f"\nSample data from {table}:")
    cur.execute(f"SELECT * FROM {table} LIMIT 1")
    columns = [desc[0] for desc in cur.description]
    data = cur.fetchone()
    if data:
        for col, val in zip(columns, data):
            print(f"{col}: {type(val).__name__} = {val}")

cur.close()
conn.close() 