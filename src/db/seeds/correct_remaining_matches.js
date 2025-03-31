const knex = require('../knex');

const remainingMatches = [
    // April 3/4/5 matches
    { home_team: "Kansas State", away_team: "BYU", match_date: "2025-04-03", location: "Home" },
    { home_team: "Oklahoma State", away_team: "Utah", match_date: "2025-04-03", location: "Home" },
    { home_team: "West Virginia", away_team: "Texas Tech", match_date: "2025-04-03", location: "Home" },
    { home_team: "Cincinnati", away_team: "Colorado", match_date: "2025-04-03", location: "Home" },
    { home_team: "Arizona", away_team: "Baylor", match_date: "2025-04-03", location: "Home" },
    { home_team: "Houston", away_team: "TCU", match_date: "2025-04-03", location: "Home" },
    { home_team: "Kansas", away_team: "Iowa State", match_date: "2025-04-03", location: "Home" },

    // April 11/12/13 matches
    { home_team: "BYU", away_team: "Utah", match_date: "2025-04-11", location: "Home" },
    { home_team: "Kansas State", away_team: "Oklahoma State", match_date: "2025-04-11", location: "Home" },
    { home_team: "Texas Tech", away_team: "Cincinnati", match_date: "2025-04-11", location: "Home" },
    { home_team: "West Virginia", away_team: "Colorado", match_date: "2025-04-11", location: "Home" },
    { home_team: "Baylor", away_team: "Arizona", match_date: "2025-04-11", location: "Home" },
    { home_team: "TCU", away_team: "Houston", match_date: "2025-04-11", location: "Home" },
    { home_team: "UCF", away_team: "Kansas", match_date: "2025-04-11", location: "Home" },

    // April 19/20 matches
    { home_team: "BYU", away_team: "Houston", match_date: "2025-04-19", location: "Home" },
    { home_team: "Kansas State", away_team: "Kansas", match_date: "2025-04-19", location: "Home" },
    { home_team: "Utah", away_team: "Iowa State", match_date: "2025-04-19", location: "Home" },
    { home_team: "Oklahoma State", away_team: "Arizona State", match_date: "2025-04-19", location: "Home" },
    { home_team: "Texas Tech", away_team: "Arizona", match_date: "2025-04-19", location: "Home" },
    { home_team: "West Virginia", away_team: "Baylor", match_date: "2025-04-19", location: "Home" },
    { home_team: "Cincinnati", away_team: "TCU", match_date: "2025-04-19", location: "Home" },
    { home_team: "Colorado", away_team: "UCF", match_date: "2025-04-19", location: "Home" },

    // April 25/26/27 matches
    { home_team: "BYU", away_team: "UCF", match_date: "2025-04-25", location: "Home" },
    { home_team: "Kansas State", away_team: "Texas Tech", match_date: "2025-04-25", location: "Home" },
    { home_team: "Utah", away_team: "Cincinnati", match_date: "2025-04-25", location: "Home" },
    { home_team: "Oklahoma State", away_team: "Colorado", match_date: "2025-04-25", location: "Home" },
    { home_team: "Arizona State", away_team: "West Virginia", match_date: "2025-04-25", location: "Home" },
    { home_team: "Arizona", away_team: "TCU", match_date: "2025-04-25", location: "Home" },
    { home_team: "Baylor", away_team: "Houston", match_date: "2025-04-25", location: "Home" },
    { home_team: "Iowa State", away_team: "Kansas", match_date: "2025-04-25", location: "Home" }
];

async function addCorrectMatches() {
    try {
        // Insert all remaining matches
        await knex('tennis_matches').insert(remainingMatches);
        console.log('Successfully added all remaining matches');
    } catch (error) {
        console.error('Error adding remaining matches:', error);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    addCorrectMatches()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { addCorrectMatches }; 