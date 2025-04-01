const knex = require('./knex');

async function initTennisData() {
  try {
    // Create tennis_stats table if it doesn't exist
    await knex.schema.createTable('tennis_stats', table => {
      table.string('team').primary();
      table.string('sport');
      table.integer('wins');
      table.integer('losses');
      table.integer('conf_wins');
      table.integer('conf_losses');
      table.float('win_percent');
      table.integer('ita_rank');
      table.string('current_streak');
      table.json('schedule');
    }).catch(e => {
      if (!e.message.includes('already exists')) {
        throw e;
      }
    });

    // Teams with known ITA rankings
    const rankedTeams = [
      { team: 'Texas Tech', ita_rank: 12 },
      { team: 'UCF', ita_rank: 19 },
      { team: 'Baylor', ita_rank: 22 },
      { team: 'Oklahoma State', ita_rank: 25 },
      { team: 'Arizona State', ita_rank: 26 },
      { team: 'TCU', ita_rank: 33 },
      { team: 'Arizona', ita_rank: 34 },
      { team: 'Kansas', ita_rank: 39 },
      { team: 'Iowa State', ita_rank: 56 },
      { team: 'Kansas State', ita_rank: 60 }
    ];

    // Teams without ITA rankings
    const unrankedTeams = [
      'BYU',
      'Utah',
      'Colorado',
      'Cincinnati',
      'West Virginia',
      'Houston'
    ];

    // Update ranked teams
    for (const team of rankedTeams) {
      // Check if team exists
      const exists = await knex('tennis_stats').where('team', team.team).first();
      
      if (exists) {
        // Update existing team
        await knex('tennis_stats')
          .where('team', team.team)
          .update({ ita_rank: team.ita_rank });
      } else {
        // Insert new team
        await knex('tennis_stats').insert({
          team: team.team,
          sport: 'womens-tennis',
          ita_rank: team.ita_rank,
          wins: 0,
          losses: 0,
          conf_wins: 0,
          conf_losses: 0,
          win_percent: 0,
          current_streak: '0'
        });
      }
    }

    // Update unranked teams
    for (const teamName of unrankedTeams) {
      // Check if team exists
      const exists = await knex('tennis_stats').where('team', teamName).first();
      
      if (exists) {
        // Update existing team to set ITA rank to NULL
        await knex('tennis_stats')
          .where('team', teamName)
          .update({ ita_rank: null });
      } else {
        // Insert new team with NULL ITA rank
        await knex('tennis_stats').insert({
          team: teamName,
          sport: 'womens-tennis',
          ita_rank: null,
          wins: 0,
          losses: 0,
          conf_wins: 0,
          conf_losses: 0,
          win_percent: 0,
          current_streak: '0'
        });
      }
    }

    console.log('Tennis data initialized successfully');
  } catch (error) {
    console.error('Error initializing tennis data:', error);
    throw error;
  }
}

initTennisData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

module.exports = { initTennisData }; 