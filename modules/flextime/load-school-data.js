/**
 * Load School Data into XII-OS Database
 * 
 * This script specifically loads school data from the school_info.json file
 * into the schools table in the DuckDB database.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const DB_PATH = path.resolve(__dirname, '../../xii-os.duckdb');
const SCHOOL_INFO_PATH = path.resolve(__dirname, '../../data/school_branding/school_info.json');
const DUCKDB_BIN = '/opt/homebrew/bin/duckdb';

/**
 * Load school data into the database
 */
async function loadSchoolData() {
  console.log('Loading school data into XII-OS Database...');
  
  try {
    // Check if the school_info.json file exists
    if (!fs.existsSync(SCHOOL_INFO_PATH)) {
      throw new Error(`School info file not found at ${SCHOOL_INFO_PATH}`);
    }
    
    // Read the school_info.json file
    console.log(`Reading school data from ${SCHOOL_INFO_PATH}`);
    const schoolData = JSON.parse(fs.readFileSync(SCHOOL_INFO_PATH, 'utf8'));
    
    // For each school, generate an insert statement
    for (const [schoolId, schoolInfo] of Object.entries(schoolData)) {
      console.log(`Loading school: ${schoolInfo.name}`);
      
      // Escape single quotes in strings
      const name = schoolInfo.name.replace(/'/g, "''");
      const primaryColor = schoolInfo.primary_color ? schoolInfo.primary_color.replace(/'/g, "''") : null;
      const secondaryColor = schoolInfo.secondary_color ? schoolInfo.secondary_color.replace(/'/g, "''") : null;
      const logoPath = schoolInfo.logo_svg ? schoolInfo.logo_svg.replace(/'/g, "''") : null;
      
      // Construct the SQL statement
      const sql = `
        INSERT INTO schools (id, name, primary_color, secondary_color, logo_path)
        VALUES ('${schoolId}', '${name}', '${primaryColor}', '${secondaryColor}', '${logoPath}')
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          primary_color = EXCLUDED.primary_color,
          secondary_color = EXCLUDED.secondary_color,
          logo_path = EXCLUDED.logo_path;
      `;
      
      // Execute the SQL
      const { stderr } = await execPromise(`${DUCKDB_BIN} ${DB_PATH} -c "${sql}"`);
      
      if (stderr && !stderr.includes('Warning') && !stderr.includes('Note')) {
        console.error(`Error loading school ${schoolId}: ${stderr}`);
      }
    }
    
    // Verify the data was loaded
    const { stdout } = await execPromise(`${DUCKDB_BIN} ${DB_PATH} -c "SELECT COUNT(*) as count FROM schools;"`);
    console.log(`\nSchools loaded: ${stdout.trim()}`);
    
    console.log('School data loading complete!');
  } catch (error) {
    console.error(`Error loading school data: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
loadSchoolData(); 