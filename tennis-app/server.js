const express = require('express');
const { Pool } = require('pg');

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
                END as conf_win_percent,
                CASE 
                    WHEN (wins + losses) > 0 
                    THEN CAST(wins AS FLOAT) / (wins + losses)
                    ELSE 0 
                END as overall_win_percent
            FROM tennis_stats 
            WHERE sport = 'womens-tennis'
            ORDER BY 
                conf_win_percent DESC,
                ita_rank ASC NULLS LAST,
                overall_win_percent DESC
        `;
        
        const result = await pool.query(query);
        
        // Format the data for the frontend
        const standings = result.rows.map(team => ({
            team: team.team,
            ita_rank: team.ita_rank,
            wins: parseInt(team.wins) || 0,
            losses: parseInt(team.losses) || 0,
            win_percent: parseFloat(team.conf_win_percent) || 0, // Use conference win percentage
            confRecord: `${team.conf_wins || 0}-${team.conf_losses || 0}`,
            tiebreaker: team.ita_rank ? `ITA Rank: #${team.ita_rank}` : 'Unranked'
        }));

        res.json({ standings });
    } catch (error) {
        console.error('Error fetching standings:', error);
        res.status(500).json({ error: 'Failed to fetch standings' });
    }
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