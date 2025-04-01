const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: {
            rejectUnauthorized: false,
            // For Google Cloud SQL, we need these specific SSL settings
            sslmode: 'require',
            // Add connection name from Google Cloud SQL
            hostNameInCertificate: 'flextime-d3747:us-south1:xii-os'
        },
        connectionTimeoutMillis: 5000
    });

    console.log('\n=== Testing Google Cloud SQL Connection ===\n');
    console.log('Connection details:', {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        instance: 'flextime-d3747:us-south1:xii-os',
        ssl: true
    });

    try {
        console.log('\nAttempting to connect to Google Cloud SQL...');
        await client.connect();
        console.log('Successfully connected to Cloud SQL instance!');

        console.log('\nTesting query...');
        const res = await client.query('SELECT NOW() as current_time');
        console.log('Current database time:', res.rows[0].current_time);

        console.log('\nTesting games table...');
        const gamesRes = await client.query('SELECT COUNT(*) FROM games');
        console.log('Number of games in database:', gamesRes.rows[0].count);

    } catch (err) {
        console.error('\nConnection error:', err.message);
        if (err.code) console.error('Error code:', err.code);
        if (err.detail) console.error('Error detail:', err.detail);
        console.error('\nFull error:', err);
        
        console.log('\nTroubleshooting steps:');
        console.log('1. Verify your IP address is authorized in Cloud SQL');
        console.log('2. Check if the instance has public IP access enabled');
        console.log('3. Verify the instance connection name is correct');
        console.log('4. Make sure the database user has proper permissions');
        console.log('\nYour IP address:');
    } finally {
        try {
            await client.end();
            console.log('\nConnection closed successfully');
        } catch (err) {
            console.error('Error closing connection:', err);
        }
        console.log('\n=== Test Complete ===\n');
    }
}

// Let's also get the current IP address
const https = require('https');
https.get('https://api.ipify.org?format=json', (resp) => {
    let data = '';
    resp.on('data', (chunk) => { data += chunk; });
    resp.on('end', () => {
        console.log('\nYour current IP address:', JSON.parse(data).ip);
        console.log('Add this IP to Cloud SQL authorized networks\n');
        testConnection().catch(console.error);
    });
}).on("error", (err) => {
    console.log("Error getting IP:", err.message);
    testConnection().catch(console.error);
}); 