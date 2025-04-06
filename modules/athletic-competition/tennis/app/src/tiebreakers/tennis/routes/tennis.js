const express = require('express');
const router = express.Router();
const TennisTiebreaker = require('../tennis_tiebreaker');

// Get tiebreaker UI
router.get('/', (req, res) => {
    res.render('tiebreaker', {
        title: 'Tennis Tiebreaker - XII-OS',
        sport: 'tennis'
    });
});

// Get tiebreaker data
router.get('/api/tiebreaker/tennis', async (req, res) => {
    try {
        const tiebreaker = new TennisTiebreaker({
            matchId: req.query.matchId,
            player1: req.query.player1,
            player2: req.query.player2
        });
        
        const data = await tiebreaker.getState();
        res.json(data);
    } catch (error) {
        console.error('Error getting tiebreaker data:', error);
        res.status(500).json({ error: 'Failed to get tiebreaker data' });
    }
});

// Process tiebreaker scenario
router.post('/api/tiebreaker/tennis', async (req, res) => {
    try {
        const tiebreaker = new TennisTiebreaker({
            matchId: req.body.matchId,
            player1: req.body.player1,
            player2: req.body.player2
        });
        
        const result = await tiebreaker.processMatch(req.body.matchData);
        res.json(result);
    } catch (error) {
        console.error('Error processing tiebreaker:', error);
        res.status(500).json({ error: 'Failed to process tiebreaker' });
    }
});

// Get tiebreaker rules
router.get('/api/tiebreaker/tennis/rules', async (req, res) => {
    try {
        const rules = await TennisTiebreaker.getRules();
        res.json(rules);
    } catch (error) {
        console.error('Error getting tiebreaker rules:', error);
        res.status(500).json({ error: 'Failed to get tiebreaker rules' });
    }
});

module.exports = router; 