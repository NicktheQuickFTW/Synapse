const express = require('express');
const { Pool } = require('pg');
const path = require('path');

// Create PostgreSQL connection pool
const pool = new Pool({
    host: '34.174.117.42',
    port: 5432,
    user: 'postgres',
    password: 'Conference12!',
    database: 'xii-os',
    ssl: { rejectUnauthorized: false }
});

const app = express();
const PORT = process.env.PORT || 3000;

// Test database connection
pool.connect((err, client, done) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Successfully connected to the database');
        done();
    }
});

// Serve static files from public directory
app.use(express.static('public'));

// Standings API endpoint
app.get('/api/tennis/standings', async (req, res) => {
    try {
        // Get team stats including ITA rankings and win/loss records
        const query = `
            SELECT 
                team, 
                wins, 
                losses, 
                conf_wins, 
                conf_losses, 
                ita_rank,
                CASE 
                    WHEN (conf_wins + conf_losses) > 0 
                    THEN CAST(conf_wins AS FLOAT) / (conf_wins + conf_losses)
                    ELSE 0 
                END as conf_win_percent
            FROM tennis_stats 
            WHERE sport = 'womens-tennis'
            ORDER BY 
                conf_win_percent DESC,
                ita_rank ASC NULLS LAST
        `;
        
        const result = await pool.query(query);
        
        // Format the data for the frontend
        const standings = result.rows.map(team => ({
            team: team.team,
            ita_rank: team.ita_rank,
            wins: parseInt(team.wins) || 0,
            losses: parseInt(team.losses) || 0,
            win_percent: parseFloat(team.conf_win_percent) || 0,
            confRecord: `${team.conf_wins || 0}-${team.conf_losses || 0}`
        }));

        res.json({ standings });
    } catch (error) {
        console.error('Error fetching standings:', error);
        res.status(500).json({ error: 'Failed to fetch standings' });
    }
});

// Team details API endpoint
app.get('/api/tennis/team/:teamName', async (req, res) => {
    try {
        const teamName = req.params.teamName;
        
        // Get team stats
        const statsQuery = `
            SELECT * FROM tennis_stats 
            WHERE sport = 'womens-tennis' AND team = $1
        `;
        const statsResult = await pool.query(statsQuery, [teamName]);
        
        if (statsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Get team matches with the correct column names
        const matchesQuery = `
            SELECT home_team, away_team, match_date, location, winner
            FROM tennis_matches 
            WHERE home_team = $1 OR away_team = $1
            ORDER BY match_date ASC
        `;
        
        const matchesResult = await pool.query(matchesQuery, [teamName]);
        
        // Format matches data based on available columns
        const matches = matchesResult.rows.map(match => {
            const isHomeTeam = match.home_team === teamName;
            const opponent = isHomeTeam ? match.away_team : match.home_team;
            // Since there's no score, we'll just show if they're the winner or not
            let result = 'Scheduled';
            if (match.winner) {
                result = match.winner === teamName ? 'W' : 'L';
            }
            
            // Check if the match is in the future
            const matchDate = new Date(match.match_date);
            const isUpcoming = matchDate > new Date();
            
            return {
                date: match.match_date,
                opponent,
                location: match.location || (isHomeTeam ? 'Home' : 'Away'),
                isUpcoming,
                result
            };
        });
        
        res.json({
            team: statsResult.rows[0],
            matches
        });
    } catch (error) {
        console.error('Error fetching team details:', error);
        res.status(500).json({ error: 'Failed to fetch team details' });
    }
});

// Serve team page
app.get('/team/:teamName', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'team.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Tennis standings server running on port ${PORT}`);
}); 