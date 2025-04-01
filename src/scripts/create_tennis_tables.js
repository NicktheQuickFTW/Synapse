const knex = require('../db/knex');
require('dotenv').config();

async function createTennisTables() {
    try {
        console.log('Setting up dedicated tennis tables...');
        
        // Check if the tennis_stats table already exists
        const hasTable = await knex.schema.hasTable('tennis_stats');
        
        if (!hasTable) {
            // Create a dedicated table for tennis stats
            await knex.schema.createTable('tennis_stats', table => {
                table.increments('id').primary();
                table.string('sport').notNullable(); // 'mens-tennis' or 'womens-tennis'
                table.string('team').notNullable();
                table.string('name');
                table.string('location');
                
                // Record stats
                table.integer('wins').defaultTo(0);
                table.integer('losses').defaultTo(0);
                table.integer('conf_wins').defaultTo(0);
                table.integer('conf_losses').defaultTo(0);
                table.float('win_percent').defaultTo(0);
                
                // Tennis specific fields
                table.string('current_streak');
                table.json('schedule');
                table.timestamp('updated_at').defaultTo(knex.fn.now());
                
                // Indexes
                table.index(['sport', 'team']);
            });
            
            console.log('✅ Successfully created tennis_stats table');
        } else {
            console.log('⚠️ tennis_stats table already exists');
        }
        
    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        await knex.destroy();
    }
}

createTennisTables(); 