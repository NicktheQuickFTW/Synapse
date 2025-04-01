const knex = require('../db/knex');
require('dotenv').config();

async function createTennisTiebreakerTable() {
    try {
        console.log('Setting up tennis tiebreaker table...');
        
        // Check if the tennis_tiebreakers table already exists
        const hasTable = await knex.schema.hasTable('tennis_tiebreakers');
        
        if (!hasTable) {
            // Create a dedicated table for tennis tiebreakers
            await knex.schema.createTable('tennis_tiebreakers', table => {
                table.increments('id').primary();
                table.string('name').notNullable().unique();
                table.text('description').notNullable();
                table.text('details').notNullable();
                table.boolean('applies_to_mens').defaultTo(true);
                table.boolean('applies_to_womens').defaultTo(true);
                table.timestamp('updated_at').defaultTo(knex.fn.now());
            });
            
            console.log('✅ Successfully created tennis_tiebreakers table');
            
            // Insert the tiebreaker policy
            const tiebreakerData = {
                name: 'Conference Seeding Tiebreaker',
                description: 'Each Conference team shall be seeded according to its dual match win percentage',
                details: `With the implementation of the clinch/clinch format to shorten matches, full match records are no longer available to break ties in seeding for the championship. The below tie-breaker procedure, that is used in other Conference team sports, will be implemented:

When only two teams are tied, head-to-head competition will break the tie and determine the higher seed.
 
When ties involve more than two teams:
Results from the collective head-to-head competition during the regular season among the tied teams in a "mini round-robin" format, ranking the tied teams by winning percentage from highest to lowest will be used to determine the seeds.
 
If during this process two teams remain tied with the same winning percentage, the two-team tiebreaking system is used, starting with head-to-head results.
 
If during this process more than two teams remain tied with the same winning percentage, a second mini round-robin format is implemented, ranking the remaining tied teams by winning percentage from highest to lowest to determine seeds. If the teams remain tied, then the two-team tiebreaking system is used, starting with head-to-head results.
 
If more than two teams are still tied, each of the tied team's record versus the team occupying the highest position in the final regular season standings, and then continuing down through the standings, eliminating tied teams with inferior records until one team gains an advantage. When arriving at another group of tied teams while comparing records, use each team's record against the collective tied teams as a group (prior to that group's own tiebreaking procedure), rather than the performance against individual tied teams.
 
Draw.In the event tiebreaking procedures are unsuccessful and more than two teams remain tied, ITA rankings will be used to assign seeds, starting with the highest ranked team.`,
                applies_to_mens: true,
                applies_to_womens: true,
                updated_at: new Date()
            };
            
            await knex('tennis_tiebreakers').insert(tiebreakerData);
            console.log('✅ Successfully added tennis tiebreaker policy to the database');
        } else {
            console.log('⚠️ tennis_tiebreakers table already exists');
            
            // Check if the tiebreaker policy already exists
            const existingPolicy = await knex('tennis_tiebreakers')
                .where({ name: 'Conference Seeding Tiebreaker' })
                .first();
                
            if (!existingPolicy) {
                // Insert the tiebreaker policy
                const tiebreakerData = {
                    name: 'Conference Seeding Tiebreaker',
                    description: 'Each Conference team shall be seeded according to its dual match win percentage',
                    details: `With the implementation of the clinch/clinch format to shorten matches, full match records are no longer available to break ties in seeding for the championship. The below tie-breaker procedure, that is used in other Conference team sports, will be implemented:

When only two teams are tied, head-to-head competition will break the tie and determine the higher seed.
 
When ties involve more than two teams:
Results from the collective head-to-head competition during the regular season among the tied teams in a "mini round-robin" format, ranking the tied teams by winning percentage from highest to lowest will be used to determine the seeds.
 
If during this process two teams remain tied with the same winning percentage, the two-team tiebreaking system is used, starting with head-to-head results.
 
If during this process more than two teams remain tied with the same winning percentage, a second mini round-robin format is implemented, ranking the remaining tied teams by winning percentage from highest to lowest to determine seeds. If the teams remain tied, then the two-team tiebreaking system is used, starting with head-to-head results.
 
If more than two teams are still tied, each of the tied team's record versus the team occupying the highest position in the final regular season standings, and then continuing down through the standings, eliminating tied teams with inferior records until one team gains an advantage. When arriving at another group of tied teams while comparing records, use each team's record against the collective tied teams as a group (prior to that group's own tiebreaking procedure), rather than the performance against individual tied teams.
 
Draw.In the event tiebreaking procedures are unsuccessful and more than two teams remain tied, ITA rankings will be used to assign seeds, starting with the highest ranked team.`,
                    applies_to_mens: true,
                    applies_to_womens: true,
                    updated_at: new Date()
                };
                
                await knex('tennis_tiebreakers').insert(tiebreakerData);
                console.log('✅ Successfully added tennis tiebreaker policy to the database');
            } else {
                // Update the existing tiebreaker policy to ensure it applies to both men's and women's tennis
                await knex('tennis_tiebreakers')
                    .where({ name: 'Conference Seeding Tiebreaker' })
                    .update({
                        applies_to_mens: true,
                        applies_to_womens: true,
                        updated_at: new Date()
                    });
                console.log('✅ Updated existing tennis tiebreaker policy to apply to both men\'s and women\'s tennis');
            }
        }
        
        // Verify the data
        const tiebreakers = await knex('tennis_tiebreakers').select('*');
        console.log(`\nCurrent tennis tiebreakers in database: ${tiebreakers.length}`);
        tiebreakers.forEach(tiebreaker => {
            console.log(`\n- ${tiebreaker.name}:`);
            console.log(`  ${tiebreaker.description}`);
            console.log(`  Applies to: ${tiebreaker.applies_to_mens ? 'Men\'s Tennis' : ''} ${tiebreaker.applies_to_womens ? (tiebreaker.applies_to_mens ? '& ' : '') + 'Women\'s Tennis' : ''}`);
        });
        
    } catch (error) {
        console.error('Error creating/updating tiebreaker table:', error);
    } finally {
        await knex.destroy();
    }
}

createTennisTiebreakerTable(); 