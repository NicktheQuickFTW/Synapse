const { Client } = require('pg');
require('dotenv').config();

async function resetDatabase() {
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

        // Drop all objects and recreate schema
        console.log('\nDropping all objects and recreating schema...');
        await client.query('DROP SCHEMA public CASCADE;');
        await client.query('CREATE SCHEMA public;');
        await client.query('GRANT ALL ON SCHEMA public TO postgres;');
        await client.query('GRANT ALL ON SCHEMA public TO public;');
        console.log('Schema reset successfully');

        // List remaining tables
        console.log('\nChecking for remaining tables...');
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        if (res.rows.length > 0) {
            console.log('Remaining tables:', res.rows.map(r => r.table_name));
        } else {
            console.log('No tables remaining in database');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
        console.log('\nDatabase connection closed');
    }
}

resetDatabase().then(() => {
    console.log('Database reset complete');
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
}); 