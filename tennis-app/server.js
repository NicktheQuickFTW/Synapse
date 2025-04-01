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
        const teamName = decodeURIComponent(req.params.teamName);
        
        // Get team stats
        const statsQuery = `
            SELECT * FROM tennis_stats 
            WHERE sport = 'womens-tennis' AND team = $1
        `;
        const statsResult = await pool.query(statsQuery, [teamName]);
        
        if (statsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }
        const team = statsResult.rows[0];

        // 1. Get COMPLETED matches from tennis_stats schedule column
        let completedMatchesRaw = [];
        try {
            if (team.schedule) {
                completedMatchesRaw = typeof team.schedule === 'string' 
                    ? JSON.parse(team.schedule) 
                    : team.schedule;
            }
        } catch (e) {
            console.error('Error parsing completed schedule from stats:', e);
        }
        
        const completedMatches = completedMatchesRaw.map(match => {
            let matchDate = new Date(NaN);
            try {
                if (match.date && match.date.includes('/')) {
                    const parts = match.date.split('/');
                    matchDate = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}T00:00:00`);
                } else if (match.date) {
                    matchDate = new Date(`${match.date}T00:00:00`);
                }
            } catch (err) { /* Ignore date parsing errors */ }
            
            return {
                date: matchDate,
                opponent: match.opponent,
                location: match.location || 'TBD',
                result: match.result || 'Result N/A',
                isUpcoming: false, // Mark as completed
                isConference: match.isConference || false
            };
        }).filter(match => !isNaN(match.date)); // Remove invalid dates
        
        // 2. Get UPCOMING matches from tennis_matches table
        let upcomingMatches = [];
        try {
            const upcomingQuery = `
                SELECT home_team, away_team, match_date, location
                FROM tennis_matches 
                WHERE (home_team = $1 OR away_team = $1)
                  AND match_date >= CURRENT_DATE
                ORDER BY match_date ASC
            `;
            const upcomingResult = await pool.query(upcomingQuery, [teamName]);
            
            upcomingMatches = upcomingResult.rows.map(match => {
                const matchDate = new Date(match.match_date);
                matchDate.setUTCHours(0, 0, 0, 0); // Use UTC date
                const isHomeTeam = match.home_team === teamName;
                
                return {
                    date: matchDate,
                    opponent: isHomeTeam ? match.away_team : match.home_team,
                    location: match.location || (isHomeTeam ? 'Home' : 'Away'),
                    result: 'Scheduled',
                    isUpcoming: true, // Mark as upcoming
                    // Determine if it's a conference match (assuming Big 12 teams are in tennis_stats)
                    // This part needs refinement based on how conference is tracked for upcoming matches
                    isConference: true // Placeholder - needs better logic
                };
            });
        } catch (e) {
            console.error('Error fetching upcoming matches:', e);
        }
        
        // Combine completed and upcoming matches
        const allMatches = [...completedMatches, ...upcomingMatches];
        
        res.json({
            team,
            matches: allMatches
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