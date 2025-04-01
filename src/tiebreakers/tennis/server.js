const express = require('express');
const router = express.Router();
const knex = require('../../db/knex');
const { 
  generateComprehensiveAnalysis, 
  getMensTennisAnalysis,
  getWomensTennisAnalysis
} = require('./tennis_tiebreaker');

// Get current standings directly from tennis_stats table
router.get('/standings', async (req, res) => {
  try {
    const { sport = 'womens-tennis' } = req.query;
    const standings = await knex('tennis_stats')
      .select('*')
      .where('sport', sport)
      .orderBy('win_percent', 'desc');
    res.json(standings);
  } catch (error) {
    console.error('Error fetching standings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comprehensive analysis for the requested sport
router.get('/analysis', async (req, res) => {
  try {
    const { sport = 'womens-tennis' } = req.query;
    let analysis;
    
    if (sport === 'mens-tennis') {
      analysis = await getMensTennisAnalysis();
    } else {
      analysis = await getWomensTennisAnalysis();
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('Error generating analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for men's tennis analysis
router.get('/mens', async (req, res) => {
  try {
    const analysis = await getMensTennisAnalysis();
    res.json(analysis);
  } catch (error) {
    console.error('Error generating men\'s tennis analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for women's tennis analysis
router.get('/womens', async (req, res) => {
  try {
    const analysis = await getWomensTennisAnalysis();
    res.json(analysis);
  } catch (error) {
    console.error('Error generating women\'s tennis analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to compare two teams head-to-head
router.get('/compare/:team1/:team2', async (req, res) => {
  try {
    const { team1, team2 } = req.params;
    const { sport = 'womens-tennis' } = req.query;
    
    // Get head-to-head data from our database
    const headToHeadData = await knex('tennis_stats')
      .select('team', 'schedule')
      .where('sport', sport)
      .whereIn('team', [team1, team2]);
    
    if (headToHeadData.length !== 2) {
      return res.status(404).json({ error: 'One or both teams not found' });
    }
    
    // Process schedules to find head-to-head matchups
    const team1Data = headToHeadData.find(t => t.team === team1);
    const team2Data = headToHeadData.find(t => t.team === team2);
    
    let team1Schedule;
    let team2Schedule;
    
    try {
      team1Schedule = typeof team1Data.schedule === 'string' ? 
        JSON.parse(team1Data.schedule) : team1Data.schedule;
      
      team2Schedule = typeof team2Data.schedule === 'string' ? 
        JSON.parse(team2Data.schedule) : team2Data.schedule;
    } catch (error) {
      console.error('Error parsing schedule data:', error);
      return res.status(500).json({ error: 'Error parsing schedule data' });
    }
    
    if (!Array.isArray(team1Schedule) || !Array.isArray(team2Schedule)) {
      return res.status(500).json({ error: 'Invalid schedule data format' });
    }
    
    // Find head-to-head matches in team1's schedule
    const headToHeadMatches = team1Schedule.filter(game => 
      game.opponent === team2 && game.result
    );
    
    // Add reverse games from team2's perspective
    const reverseMatches = team2Schedule.filter(game => 
      game.opponent === team1 && game.result
    );
    
    const comparison = {
      team1,
      team2,
      headToHeadMatches,
      reverseMatches,
      sport
    };
    
    res.json(comparison);
  } catch (error) {
    console.error('Error comparing teams:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 