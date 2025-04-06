import psycopg2
from psycopg2.extras import RealDictCursor, Json
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Source database (Google Cloud PostgreSQL)
source_conn = psycopg2.connect(
    host=os.getenv('SOURCE_DB_HOST', '34.174.117.42'),
    port=int(os.getenv('SOURCE_DB_PORT', 5432)),
    user=os.getenv('SOURCE_DB_USER', 'postgres'),
    password=os.getenv('SOURCE_DB_PASSWORD', 'Conference12!'),
    database=os.getenv('SOURCE_DB_NAME', 'xii-os'),
    sslmode='require'
)

# Destination database (Neon)
dest_conn = psycopg2.connect(
    host=os.getenv('NEON_DB_HOST'),
    port=int(os.getenv('NEON_DB_PORT', 5432)),
    user=os.getenv('NEON_DB_USER'),
    password=os.getenv('NEON_DB_PASSWORD'),
    database=os.getenv('NEON_DB_NAME'),
    sslmode='require'
)

def get_table_names(cursor):
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    """)
    return [row[0] for row in cursor.fetchall()]

def get_column_info(cursor, table_name):
    cursor.execute(f"""
        SELECT column_name, data_type, character_maximum_length, 
               is_nullable, column_default, 
               pg_get_serial_sequence('public.{table_name}', column_name) as sequence_name
        FROM information_schema.columns 
        WHERE table_name = '{table_name}'
        ORDER BY ordinal_position
    """)
    return cursor.fetchall()

def create_sequence(cursor, sequence_name):
    if sequence_name:
        try:
            cursor.execute(f"CREATE SEQUENCE IF NOT EXISTS {sequence_name}")
            print(f"Created sequence: {sequence_name}")
        except Exception as e:
            print(f"Error creating sequence {sequence_name}: {str(e)}")

def get_create_table_sql(cursor, table_name):
    columns = get_column_info(cursor, table_name)
    
    sql_parts = []
    sequences_to_create = []
    
    for col in columns:
        col_name = col[0]
        data_type = col[1]
        max_length = col[2]
        is_nullable = col[3]
        default = col[4]
        sequence_name = col[5]
        
        if sequence_name:
            sequences_to_create.append(sequence_name)
            data_type = "integer"
            default = f"nextval('{sequence_name}'::regclass)"
        
        if data_type == 'character varying':
            if max_length:
                data_type = f"varchar({max_length})"
            else:
                data_type = "text"
        elif data_type == 'ARRAY':
            data_type = "text[]"
        elif data_type in ('jsonb', 'json'):
            data_type = "jsonb"
        
        nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
        default_clause = f"DEFAULT {default}" if default else ""
        
        sql_parts.append(f"{col_name} {data_type} {nullable} {default_clause}".strip())
    
    return f"CREATE TABLE IF NOT EXISTS {table_name} (\n  " + ",\n  ".join(sql_parts) + "\n);", sequences_to_create

def create_table(dest_cursor, table_name, create_sql, sequences):
    try:
        for sequence in sequences:
            create_sequence(dest_cursor, sequence)
        
        dest_cursor.execute(create_sql)
        dest_conn.commit()
        print(f"Table {table_name} created successfully")
    except Exception as e:
        print(f"Error creating table {table_name}: {str(e)}")
        dest_conn.rollback()

def convert_row_to_json(row, columns):
    """Convert any dictionary or list values in the row to proper JSON format"""
    converted_row = list(row)
    for i, (value, col_info) in enumerate(zip(row, columns)):
        data_type = col_info[1]
        if data_type in ('json', 'jsonb'):
            if isinstance(value, (dict, list)):
                converted_row[i] = Json(value)
            elif isinstance(value, str):
                try:
                    converted_row[i] = Json(json.loads(value))
                except:
                    converted_row[i] = Json({})
            else:
                converted_row[i] = Json({})
    return tuple(converted_row)

def migrate_table(source_cursor, dest_cursor, table_name):
    print(f"\nMigrating table: {table_name}")
    
    # Get column info
    columns = get_column_info(source_cursor, table_name)
    column_names = [col[0] for col in columns]
    columns_str = ', '.join(column_names)
    
    # Create table in destination
    create_sql, sequences = get_create_table_sql(source_cursor, table_name)
    create_table(dest_cursor, table_name, create_sql, sequences)
    
    # Drop existing data if any
    try:
        dest_cursor.execute(f"TRUNCATE TABLE {table_name} RESTART IDENTITY CASCADE")
        dest_conn.commit()
    except Exception as e:
        print(f"Error truncating table {table_name}: {str(e)}")
        dest_conn.rollback()
    
    # Fetch data from source
    source_cursor.execute(f"SELECT {columns_str} FROM {table_name}")
    rows = source_cursor.fetchall()
    
    if not rows:
        print(f"No data in table {table_name}")
        return
    
    # Convert rows to handle JSON data
    converted_rows = [convert_row_to_json(row, columns) for row in rows]
    
    # Prepare insert statement
    placeholders = ', '.join(['%s'] * len(column_names))
    insert_query = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"
    
    # Insert data into destination
    try:
        dest_cursor.executemany(insert_query, converted_rows)
        dest_conn.commit()
        print(f"Successfully migrated {len(rows)} rows from {table_name}")
    except Exception as e:
        print(f"Error migrating table {table_name}: {str(e)}")
        print("First row data:")
        for col, val in zip(column_names, converted_rows[0]):
            print(f"{col}: {type(val).__name__} = {val}")
        dest_conn.rollback()

def main():
    try:
        source_cursor = source_conn.cursor()
        dest_cursor = dest_conn.cursor()
        
        # Get all table names
        tables = get_table_names(source_cursor)
        print(f"Found tables: {tables}")
        
        # Migrate each table
        for table in tables:
            migrate_table(source_cursor, dest_cursor, table)
            
    except Exception as e:
        print(f"Error during migration: {str(e)}")
    finally:
        source_cursor.close()
        dest_cursor.close()
        source_conn.close()
        dest_conn.close()

if __name__ == "__main__":
    main() 