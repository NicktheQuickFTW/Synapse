/**
 * Setup Wrestling Database
 * 
 * Script to run migrations and seed data for the FlexTime wrestling application
 */

require('dotenv').config();
const knex = require('../db/knex');
const path = require('path');
const fs = require('fs');

async function setupWrestlingDatabase() {
  console.log('⚡ Setting up FlexTime Wrestling database...');
  
  try {
    // Check if migrations directory exists
    const migrationsDir = path.join(__dirname, '../db/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.error('Error: Migrations directory not found');
      process.exit(1);
    }
    
    // Run migrations
    console.log('🔄 Running migrations...');
    await knex.migrate.latest();
    console.log('✅ Migrations completed');
    
    // Run seed files
    console.log('🌱 Seeding database...');
    await knex.seed.run({
      directory: path.join(__dirname, '../db/seeds/development')
    });
    console.log('✅ Database seeded successfully');
    
    console.log('✨ Wrestling database setup complete');
    
    // Clean up connection
    await knex.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up wrestling database:', error);
    await knex.destroy();
    process.exit(1);
  }
}

// Run the setup
setupWrestlingDatabase(); 