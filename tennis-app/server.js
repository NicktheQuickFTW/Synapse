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
        // Get team standings from the wten_standings table
        const query = `
            SELECT 
                team, 
                wins, 
                losses, 
                conf_wins, 
                conf_losses, 
                ita_rank,
                conf_win_percent
            FROM wten_standings 
            ORDER BY 
                conf_win_percent DESC,
                -- Custom sorting logic for the 6-3 tie (conf_win_percent = 0.667)
                CASE 
                    WHEN conf_win_percent = 0.667 THEN
                        CASE team
                            WHEN 'Arizona' THEN 1
                            WHEN 'Arizona State' THEN 2
                            WHEN 'TCU' THEN 3
                            WHEN 'Baylor' THEN 4
                            WHEN 'BYU' THEN 5
                            ELSE 6 -- Should not happen in this group
                        END
                    ELSE 0 -- Assign 0 to all other groups for correct relative sorting
                END ASC,
                -- Fallback for other ties (like 8-1) using ITA rank
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
        
        // 1. Get team stats from wten_standings
        const statsQuery = `SELECT * FROM wten_standings WHERE team = $1`;
        const statsResult = await pool.query(statsQuery, [teamName]);
        
        if (statsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }
        const team = statsResult.rows[0];

        // 2. Get UPCOMING matches from wten_schedules table rows
        let upcomingMatches = [];
        try {
            const upcomingQuery = `
                SELECT home_team, away_team, match_date, location
                FROM wten_schedules 
                WHERE (home_team = $1 OR away_team = $1)
                  AND match_date >= CURRENT_DATE
                ORDER BY match_date ASC
            `;
            const upcomingResult = await pool.query(upcomingQuery, [teamName]);
            
            upcomingMatches = upcomingResult.rows.map(match => {
                const matchDate = new Date(match.match_date);
                matchDate.setUTCHours(0, 0, 0, 0); // Use UTC date for comparison
                const isHomeTeam = match.home_team === teamName;
                
                return {
                    date: matchDate,
                    opponent: isHomeTeam ? match.away_team : match.home_team,
                    location: match.location || (isHomeTeam ? 'Home' : 'Away'),
                    result: 'Scheduled',
                    isUpcoming: true,
                    isConference: true // Placeholder - Assuming conference
                };
            }).filter(match => !isNaN(match.date));
        } catch (e) {
            console.error('Error fetching upcoming matches from wten_schedules rows:', e);
        }

        // 3. Get COMPLETED matches from the schedule JSONB column in the team's wten_schedules row
        let completedMatches = [];
        try {
            // Find the row in wten_schedules for this team to get its schedule JSON
            // Assuming the JSON is stored in the row where the team is the home_team
            // This might need adjustment if that assumption is wrong.
            const scheduleQuery = `SELECT schedule FROM wten_schedules WHERE home_team = $1 LIMIT 1`;
            const scheduleResult = await pool.query(scheduleQuery, [teamName]);
            
            if (scheduleResult.rows.length > 0 && scheduleResult.rows[0].schedule) {
                let completedMatchesRaw = [];
                const scheduleData = scheduleResult.rows[0].schedule;
                completedMatchesRaw = typeof scheduleData === 'string' 
                    ? JSON.parse(scheduleData) 
                    : scheduleData; // Assume it's already JSONB

                completedMatches = completedMatchesRaw.map(match => {
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
                }).filter(match => !isNaN(match.date));
            }
        } catch (e) {
            console.error('Error fetching/parsing completed schedule from wten_schedules JSON:', e);
        }
        
        // Combine completed and upcoming matches
        const allMatches = [...completedMatches, ...upcomingMatches];
        
        res.json({
            team, // Team stats from wten_standings
            matches: allMatches // Combined matches
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