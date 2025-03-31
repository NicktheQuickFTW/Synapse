const knex = require('./knex');

async function runMigrations() {
  try {
    // Run all pending migrations
    await knex.migrate.latest();
    console.log('Successfully ran all pending migrations');

    // Get the current version of the database
    const version = await knex.migrate.currentVersion();
    console.log('Current database version:', version);
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  } finally {
    // Close the database connection
    await knex.destroy();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runMigrations }; 