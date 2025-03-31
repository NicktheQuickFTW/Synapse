const express = require('express');
const router = express.Router();
const { generateComprehensiveAnalysis } = require('../tennis_tiebreaker');

// Get comprehensive analysis
router.get('/analysis', async (req, res) => {
  try {
    const analysis = await generateComprehensiveAnalysis();
    res.json(analysis);
  } catch (error) {
    console.error('Error generating analysis:', error);
    res.status(500).json({ error: 'Failed to generate analysis' });
  }
});

// Update match result
router.post('/matches/:id/result', async (req, res) => {
  const { id } = req.params;
  const { winner } = req.body;

  try {
    // Update match result
    await knex('tennis_matches')
      .where({ id })
      .update({ winner });

    // Recalculate standings
    const matches = await knex('tennis_matches')
      .select('*')
      .whereNotNull('winner');

    // Reset standings
    await knex('tennis_standings').update({
      wins: 0,
      losses: 0,
      win_pct: 0
    });

    // Calculate new standings
    const standings = {};
    matches.forEach(match => {
      if (!standings[match.home_team]) {
        standings[match.home_team] = { wins: 0, losses: 0 };
      }
      if (!standings[match.away_team]) {
        standings[match.away_team] = { wins: 0, losses: 0 };
      }

      if (match.winner === match.home_team) {
        standings[match.home_team].wins++;
        standings[match.away_team].losses++;
      } else {
        standings[match.home_team].losses++;
        standings[match.away_team].wins++;
      }
    });

    // Update standings
    for (const [team, record] of Object.entries(standings)) {
      const winPct = record.wins / (record.wins + record.losses);
      await knex('tennis_standings')
        .where({ team_name: team })
        .update({
          wins: record.wins,
          losses: record.losses,
          win_pct: winPct
        });
    }

    // Generate new analysis
    const analysis = await generateComprehensiveAnalysis();
    res.json(analysis);
  } catch (error) {
    console.error('Error updating match result:', error);
    res.status(500).json({ error: 'Failed to update match result' });
  }
});

// Add head-to-head result
router.post('/head-to-head', async (req, res) => {
  const { team1, team2, winner } = req.body;

  try {
    // Add head-to-head result
    await knex('tennis_head_to_head').insert({
      team1,
      team2,
      winner
    });

    // Generate new analysis
    const analysis = await generateComprehensiveAnalysis();
    res.json(analysis);
  } catch (error) {
    console.error('Error adding head-to-head result:', error);
    res.status(500).json({ error: 'Failed to add head-to-head result' });
  }
});

module.exports = router; 