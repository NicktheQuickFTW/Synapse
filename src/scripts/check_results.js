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
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    }
};

async function checkResults() {
    const db = knex(config);
    
    try {
        console.log('\n=== Big 12 Schedule Results ===\n');
        console.log('Connecting to database...');
        console.log(`Host: ${process.env.DB_HOST}`);
        console.log(`Database: ${process.env.DB_NAME}`);
        
        // Test database connection
        await db.raw('SELECT 1');
        console.log('Database connected successfully');
        
        // Get all matches grouped by school and sport
        console.log('Fetching matches...');
        const matches = await db('matches')
            .select('*')
            .orderBy('school')
            .orderBy('sport')
            .orderBy('date');

        if (matches.length === 0) {
            console.log('No matches found in the database.');
            return;
        }

        console.log(`Found ${matches.length} total matches`);

        // Group matches by school and sport
        const groupedMatches = matches.reduce((acc, match) => {
            const key = `${match.school}-${match.sport}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(match);
            return acc;
        }, {});

        console.log(`Found ${Object.keys(groupedMatches).length} school-sport combinations`);

        // Display results
        for (const [key, schoolMatches] of Object.entries(groupedMatches)) {
            const [school, sport] = key.split('-');
            console.log(`\n${school.toUpperCase()} - ${sport.toUpperCase()}`);
            console.log('----------------------------------------');
            
            const conferenceGames = schoolMatches.filter(m => m.is_conference);
            const nonConferenceGames = schoolMatches.filter(m => !m.is_conference);
            
            console.log(`Total Games: ${schoolMatches.length}`);
            console.log(`Conference Games: ${conferenceGames.length}`);
            console.log(`Non-Conference Games: ${nonConferenceGames.length}`);
            
            console.log('\nRecent Games:');
            schoolMatches.slice(-5).forEach(match => {
                const result = match.result ? ` (${match.result})` : '';
                const score = match.score ? ` ${match.score}` : '';
                const conf = match.is_conference ? ' [CONF]' : '';
                console.log(`${match.date}: vs ${match.opponent}${result}${score}${conf}`);
            });
        }

    } catch (error) {
        console.error('Error checking results:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        console.log('\nClosing database connection...');
        await db.destroy();
        console.log('Database connection closed');
        console.log('\n=== End of Results ===\n');
    }
}

// Run the script
console.log('Starting check_results.js...');
checkResults().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 