const knex = require('knex');
require('dotenv').config();

const config = {
    client: 'pg',
    connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },  // Force SSL without rejection
        connectionTimeoutMillis: 5000,       // 5 seconds
        query_timeout: 10000                 // 10 seconds
    },
    debug: true  // Enable debug logging
};

async function checkResults() {
    console.log('\n=== Big 12 Schedule Results ===\n');
    console.log('Configuration:', {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        ssl: true
    });

    let db;
    try {
        console.log('Initializing database connection...');
        db = knex(config);
        
        console.log('Testing connection...');
        const result = await db.raw('SELECT NOW() as current_time');
        console.log('Connection test successful:', result.rows[0].current_time);
        
        // Get all games grouped by school and sport
        console.log('Fetching games...');
        const games = await db('games')
            .select('*')
            .orderBy('school')
            .orderBy('sport')
            .orderBy('date')
            .timeout(5000, { cancel: true });  // 5 second timeout

        if (games.length === 0) {
            console.log('No games found in the database.');
            return;
        }

        console.log(`Found ${games.length} total games`);

        // Group games by school and sport
        const groupedGames = games.reduce((acc, game) => {
            const key = `${game.school}-${game.sport}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(game);
            return acc;
        }, {});

        console.log(`Found ${Object.keys(groupedGames).length} school-sport combinations`);

        // Display results
        for (const [key, schoolGames] of Object.entries(groupedGames)) {
            const [school, sport] = key.split('-');
            console.log(`\n${school.toUpperCase()} - ${sport.toUpperCase()}`);
            console.log('----------------------------------------');
            
            const conferenceGames = schoolGames.filter(g => g.is_conference);
            const nonConferenceGames = schoolGames.filter(g => !g.is_conference);
            
            console.log(`Total Games: ${schoolGames.length}`);
            console.log(`Conference Games: ${conferenceGames.length}`);
            console.log(`Non-Conference Games: ${nonConferenceGames.length}`);
            
            console.log('\nRecent Games:');
            schoolGames.slice(-5).forEach(game => {
                const result = game.result ? ` (${game.result})` : '';
                const score = game.score ? ` ${game.score}` : '';
                const conf = game.is_conference ? ' [CONF]' : '';
                console.log(`${game.date}: vs ${game.opponent}${result}${score}${conf}`);
            });
        }

    } catch (error) {
        console.error('\nDatabase Error Details:');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.code) console.error('Error Code:', error.code);
        if (error.errno) console.error('Error Number:', error.errno);
        if (error.sqlState) console.error('SQL State:', error.sqlState);
        if (error.sqlMessage) console.error('SQL Message:', error.sqlMessage);
        console.error('\nStack trace:', error.stack);
    } finally {
        if (db) {
            console.log('\nAttempting to close database connection...');
            try {
                await db.destroy();
                console.log('Database connection closed successfully');
            } catch (error) {
                console.error('Error closing database connection:', error);
            }
        }
        console.log('\n=== End of Results ===\n');
    }
}

// Run the script
console.log('Starting check_results.js...');
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
checkResults().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 