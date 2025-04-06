import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`User: ${process.env.DB_USER}`);
    
    await client.connect();
    console.log('Connected to database successfully!');
    
    console.log('\nListing all tables:');
    const { rows } = await client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    
    if (rows.length === 0) {
      console.log('  No tables found');
    } else {
      rows.forEach(row => console.log(`  - ${row.tablename}`));
    }
    
    // Try to query a specific table
    try {
      console.log('\nTrying to query schema information:');
      const { rows: schemas } = await client.query("SELECT schema_name FROM information_schema.schemata");
      console.log('Available schemas:');
      schemas.forEach(schema => console.log(`  - ${schema.schema_name}`));
      
      console.log('\nTrying to query all tables in all schemas:');
      const { rows: allTables } = await client.query(
        "SELECT table_schema, table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'"
      );
      
      if (allTables.length === 0) {
        console.log('  No tables found in any schema');
      } else {
        allTables.forEach(table => console.log(`  - ${table.table_schema}.${table.table_name}`));
      }
    } catch (err) {
      console.error('Error querying schema information:', err);
    }
  } catch (err) {
    console.error('Error connecting to database:', err);
  } finally {
    await client.end();
  }
}

main().catch(err => console.error('Unhandled error:', err)); 