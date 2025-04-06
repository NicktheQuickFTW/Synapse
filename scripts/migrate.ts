import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection
const pgClient = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false // For self-signed certs; change to true for CA-signed certs
  }
});

// Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

async function checkTable(tableName: string): Promise<boolean> {
  try {
    await pgClient.query(`SELECT * FROM ${tableName} LIMIT 1`);
    return true;
  } catch (error) {
    return false;
  }
}

async function migrateUsers() {
  console.log('Migrating users...');
  
  if (!(await checkTable('users'))) {
    console.error("Table 'users' does not exist in the source database.");
    return;
  }
  
  const { rows: users } = await pgClient.query('SELECT * FROM users');
  console.log(`Found ${users.length} users to migrate`);
  
  for (const user of users) {
    const { error } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at
      }]);
    
    if (error) {
      console.error(`Error migrating user ${user.id}:`, error);
    } else {
      console.log(`Migrated user ${user.id}`);
    }
  }
}

async function migrateModules() {
  console.log('Migrating modules...');
  
  if (!(await checkTable('modules'))) {
    console.error("Table 'modules' does not exist in the source database.");
    return;
  }
  
  const { rows: modules } = await pgClient.query('SELECT * FROM modules');
  console.log(`Found ${modules.length} modules to migrate`);
  
  for (const module of modules) {
    const { error } = await supabase
      .from('modules')
      .insert([{
        id: module.id,
        name: module.name,
        description: module.description,
        repo_url: module.repo_url,
        version: module.version,
        is_active: module.is_active,
        config: module.config,
        created_at: module.created_at,
        updated_at: module.updated_at
      }]);
    
    if (error) {
      console.error(`Error migrating module ${module.id}:`, error);
    } else {
      console.log(`Migrated module ${module.id}`);
    }
  }
}

async function migrateSessions() {
  console.log('Migrating sessions...');
  
  if (!(await checkTable('sessions'))) {
    console.error("Table 'sessions' does not exist in the source database.");
    return;
  }
  
  const { rows: sessions } = await pgClient.query('SELECT * FROM sessions');
  console.log(`Found ${sessions.length} sessions to migrate`);
  
  for (const session of sessions) {
    const { error } = await supabase
      .from('sessions')
      .insert([{
        id: session.id,
        user_id: session.user_id,
        token: session.token,
        expires_at: session.expires_at,
        created_at: session.created_at,
        updated_at: session.updated_at
      }]);
    
    if (error) {
      console.error(`Error migrating session ${session.id}:`, error);
    } else {
      console.log(`Migrated session ${session.id}`);
    }
  }
}

async function listAllTables() {
  try {
    const { rows } = await pgClient.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log('Available tables in the database:');
    if (rows.length === 0) {
      console.log('  No tables found');
    } else {
      rows.forEach(row => console.log(`  - ${row.tablename}`));
    }
  } catch (error) {
    console.error('Error listing tables:', error);
  }
}

async function migrate() {
  try {
    console.log('Starting migration...');
    await pgClient.connect();
    
    // List all available tables
    await listAllTables();
    
    // Migrate in order of dependencies
    await migrateUsers();
    await migrateModules();
    await migrateSessions();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pgClient.end();
  }
}

migrate(); 