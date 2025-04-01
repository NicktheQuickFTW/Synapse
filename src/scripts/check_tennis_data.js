const knex = require('../db/knex');
require('dotenv').config();

async function main() {
    try {
        console.log('Checking tennis_stats table data...\n');
        
        const stats = await knex('tennis_stats')
            .where('sport', 'womens-tennis')
            .orderBy(['conf_wins', 'wins'], 'desc');
        
        console.log('Found', stats.length, 'records\n');
        
        stats.forEach(team => {
            console.log(`${team.name}:`);
            console.log(`Overall: ${team.wins}-${team.losses} (${(team.win_percent * 100).toFixed(1)}%)`);
            console.log(`Conference: ${team.conf_wins}-${team.conf_losses}`);
            console.log(`Location: ${team.location}`);
            console.log(`Current Streak: ${team.current_streak}`);
            console.log('Schedule:', team.schedule ? team.schedule.length : 0, 'games\n');
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await knex.destroy();
    }
}

main(); 