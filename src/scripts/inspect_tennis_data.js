const knex = require('../db/knex');
require('dotenv').config();

async function inspectTennisData() {
    try {
        // Get a sample team's data
        const team = await knex('tennis_stats')
            .where('sport', 'womens-tennis')
            .first();

        if (team) {
            console.log('\nTeam name:', team.team);
            console.log('Overall record:', `${team.wins}-${team.losses}`);
            console.log('Conference record:', `${team.conf_wins}-${team.conf_losses}`);
            
            // Check schedule data type and content
            console.log('\nSchedule data type:', typeof team.schedule);
            
            if (typeof team.schedule === 'string') {
                console.log('Schedule first 100 chars:', team.schedule.substring(0, 100));
                try {
                    const parsedSchedule = JSON.parse(team.schedule);
                    console.log('\nParsed schedule successfully');
                    console.log('First game:', JSON.stringify(parsedSchedule[0], null, 2));
                } catch (error) {
                    console.error('Failed to parse schedule:', error);
                    
                    // Try to see what's actually stored
                    if (team.schedule.startsWith('[object Object]')) {
                        console.log('\nDetected [object Object] in the string');
                        console.log('This suggests schedule data was not properly stringified before storage');
                    }
                }
            } else {
                console.log('Schedule raw value:', team.schedule);
                console.log('This suggests schedule data is already an object, not a string');
            }
        } else {
            console.log('No tennis data found in database');
        }

    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await knex.destroy();
    }
}

inspectTennisData(); 