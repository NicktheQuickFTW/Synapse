const knex = require('../db/knex');

async function main() {
    try {
        console.log('Testing database connection...\n');
        
        // Test basic connection
        await knex.raw('SELECT 1');
        console.log('Basic connection successful');
        
        // Test table existence
        const tables = await knex.raw(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('\nAvailable tables:', tables.rows.map(r => r.table_name));
        
        // Test tennis_stats table structure
        const columns = await knex.raw(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'tennis_stats'
        `);
        console.log('\ntennis_stats columns:', columns.rows.map(r => `${r.column_name} (${r.data_type})`));
        
        // Test insert permission
        const testData = {
            team: 'TEST',
            sport: 'womens-tennis',
            wins: 0,
            losses: 0,
            conf_wins: 0,
            conf_losses: 0,
            win_percent: 0,
            conf_win_percent: 0,
            points_for: 0,
            points_against: 0,
            streak: 0,
            max_streak: 0,
            conf_streak: 0,
            max_conf_streak: 0,
            conf_rank: 0,
            schedule: JSON.stringify([])
        };
        
        await knex('tennis_stats').insert(testData);
        console.log('\nInsert test successful');
        
        // Clean up test data
        await knex('tennis_stats').where({ team: 'TEST' }).del();
        console.log('Test data cleaned up');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await knex.destroy();
    }
}

main(); 