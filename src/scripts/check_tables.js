const { Client } = require('pg');
require('dotenv').config();

async function checkTables() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully');

        // Check all tables
        console.log('\nChecking all tables in database...');
        const tables = await client.query(`
            SELECT table_name, table_schema 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        if (tables.rows.length > 0) {
            console.log('\nExisting tables:');
            tables.rows.forEach(row => {
                console.log(`- ${row.table_name}`);
            });
        } else {
            console.log('No tables found in database');
        }

        // Check migrations table if it exists
        const migrationTableExists = tables.rows.some(row => row.table_name === 'knex_migrations');
        if (migrationTableExists) {
            console.log('\nChecking migration history...');
            const migrations = await client.query('SELECT * FROM knex_migrations ORDER BY id');
            console.log('\nMigration history:');
            migrations.rows.forEach(row => {
                console.log(`- ${row.name} (${row.migration_time})`);
            });
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
        console.log('\nDatabase connection closed');
    }
}

checkTables().then(() => {
    console.log('Check complete');
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
}); 