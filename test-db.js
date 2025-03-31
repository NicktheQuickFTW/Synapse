require('dotenv').config();

const { Client } = require('pg');

const client = new Client({
  host: '34.174.117.42',
  port: 5432,
  user: 'postgres',
  password: 'Conference12!',
  database: 'xii-os',
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('Attempting to connect to database...');
console.log('Connection details:', {
  host: '34.174.117.42',
  port: 5432,
  user: 'postgres',
  database: 'xii-os',
  ssl: true
});

client.connect()
  .then(() => {
    console.log('Successfully connected to database');
    return client.query('SELECT 1');
  })
  .then(result => {
    console.log('Query result:', result.rows);
    console.log('Database connection and query successful');
  })
  .catch(err => {
    console.error('Error details:', {
      code: err.code,
      message: err.message,
      stack: err.stack
    });
  })
  .finally(() => {
    client.end();
  }); 