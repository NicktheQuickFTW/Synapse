/**
 * Initialize XII-OS Database for FlexTime
 * 
 * This script initializes the DuckDB database with the schema needed for FlexTime.
 * It creates all required tables and loads initial data from the school_info.json file.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const DB_PATH = path.resolve(__dirname, '../../xii-os.duckdb');
const SCHEMA_PATH = path.resolve(__dirname, './config/schema.sql');
const SCHOOL_INFO_PATH = path.resolve(__dirname, '../../data/school_branding/school_info.json');
const DUCKDB_BIN = '/opt/homebrew/bin/duckdb';

/**
 * Initialize the database with the schema
 */
async function initializeDatabase() {
  console.log('Initializing XII-OS Database for FlexTime...');
  
  try {
    // Check if the schema file exists
    if (!fs.existsSync(SCHEMA_PATH)) {
      throw new Error(`Schema file not found at ${SCHEMA_PATH}`);
    }
    
    // Read the schema file
    console.log(`Reading schema from ${SCHEMA_PATH}`);
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    
    // Execute the schema against the database
    console.log(`Executing schema against ${DB_PATH}`);
    const { stdout, stderr } = await execPromise(`${DUCKDB_BIN} ${DB_PATH} -c "${schema}"`);
    
    if (stderr && !stderr.includes('Warning') && !stderr.includes('Note')) {
      console.error(`Error during schema execution: ${stderr}`);
    }
    
    // Import school data directly (in DuckDB compatible way)
    console.log('Loading school data from school_info.json');
    const loadSchoolSql = `
      INSERT INTO schools (id, name, primary_color, secondary_color, logo_path)
      SELECT 
        key as id, 
        json_extract_string(value, '$.name') as name,
        json_extract_string(value, '$.primary_color') as primary_color,
        json_extract_string(value, '$.secondary_color') as secondary_color,
        json_extract_string(value, '$.logo_svg') as logo_path
      FROM 
        read_json_objects('${SCHOOL_INFO_PATH}');
    `;
    
    try {
      const { stdout: dataStdout, stderr: dataStderr } = await execPromise(`${DUCKDB_BIN} ${DB_PATH} -c "${loadSchoolSql}"`);
      
      if (dataStderr && !dataStderr.includes('Warning') && !dataStderr.includes('Note')) {
        console.error(`Error during school data loading: ${dataStderr}`);
      } else {
        console.log('School data loaded successfully');
      }
    } catch (error) {
      console.error(`School data loading error: ${error.message}`);
      console.log('Continuing with initialization...');
    }
    
    // Verify the tables were created
    console.log('Verifying database tables...');
    const { stdout: tablesStdout } = await execPromise(`${DUCKDB_BIN} ${DB_PATH} -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main';"`);
    
    console.log('\nDatabase tables created:');
    console.log(tablesStdout);
    
    // Verify sample data
    console.log('\nVerifying sample data:');
    try {
      const { stdout: schoolsStdout } = await execPromise(`${DUCKDB_BIN} ${DB_PATH} -c "SELECT COUNT(*) as school_count FROM schools;"`);
      console.log(`Schools loaded: ${schoolsStdout.trim()}`);
    } catch (error) {
      console.log('Schools table not available or empty');
    }
    
    try {
      const { stdout: sportsStdout } = await execPromise(`${DUCKDB_BIN} ${DB_PATH} -c "SELECT COUNT(*) as sport_count FROM sports;"`);
      console.log(`Sports loaded: ${sportsStdout.trim()}`);
    } catch (error) {
      console.log('Sports table not available or empty');
    }
    
    console.log('\nXII-OS Database initialization complete!');
    console.log(`Database location: ${DB_PATH}`);
    
  } catch (error) {
    console.error(`Error initializing database: ${error.message}`);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase(); 