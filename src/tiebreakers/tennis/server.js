const express = require('express');
const router = express.Router();
const knex = require('../../db/knex');
const { generateComprehensiveAnalysis } = require('./tennis_tiebreaker');

// Get current standings
router.get('/standings', async (req, res) => {
  try {
    const { sport = 'womens-tennis' } = req.query;
    const standings = await knex('tennis_standings')
      .where('sport', sport)
      .orderBy('win_pct', 'desc')
      .orderBy('ita_rank', 'asc');
    res.json(standings);
  } catch (error) {
    console.error('Error fetching standings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get remaining matches
router.get('/matches', async (req, res) => {
  try {
    const { sport = 'womens-tennis' } = req.query;
    const matches = await knex('tennis_matches')
      .where('sport', sport)
      .whereNull('winner')
      .orderBy('match_date', 'asc');
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get head-to-head results
router.get('/head-to-head', async (req, res) => {
  try {
    const { sport = 'womens-tennis' } = req.query;
    const headToHead = await knex('tennis_head_to_head')
      .where('sport', sport);
    res.json(headToHead);
  } catch (error) {
    console.error('Error fetching head-to-head results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current seedings
router.get('/seedings', async (req, res) => {
  try {
    const { sport = 'womens-tennis' } = req.query;
    const seedings = await knex('tennis_seedings')
      .where('sport', sport)
      .orderBy('seed', 'asc');
    res.json(seedings);
  } catch (error) {
    console.error('Error fetching seedings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comprehensive analysis
router.get('/analysis', async (req, res) => {
  try {
    const { sport = 'womens-tennis' } = req.query;
    const standings = await knex('tennis_standings')
      .where('sport', sport)
      .orderBy('win_pct', 'desc')
      .orderBy('ita_rank', 'asc');
    const matches = await knex('tennis_matches')
      .where('sport', sport)
      .whereNull('winner')
      .orderBy('match_date', 'asc');
    const headToHead = await knex('tennis_head_to_head')
      .where('sport', sport);

    const analysis = generateComprehensiveAnalysis(standings, matches, headToHead);
    res.json(analysis);
  } catch (error) {
    console.error('Error generating analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update match result
router.post('/matches/:id/result', async (req, res) => {
  const { id } = req.params;
  const { winner, sport = 'womens-tennis' } = req.body;

  try {
    // Start a transaction
    await knex.transaction(async (trx) => {
      // Update match result
      await trx('tennis_matches')
        .where({ id, sport })
        .update({ winner });

      // Get updated match data
      const match = await trx('tennis_matches')
        .where({ id, sport })
        .first();

      // Update standings for both teams
      const teams = [match.home_team, match.away_team];
      for (const team of teams) {
        const isWinner = team === winner;
        await trx('tennis_standings')
          .where({ team_name: team, sport })
          .increment(isWinner ? 'wins' : 'losses', 1)
          .update({
            win_pct: knex.raw('CAST(wins AS FLOAT) / NULLIF(wins + losses, 0)')
          });
      }

      // Add head-to-head result
      await trx('tennis_head_to_head').insert({
        team1: match.home_team,
        team2: match.away_team,
        winner,
        sport
      });

      // Recalculate seedings
      const standings = await trx('tennis_standings')
        .where('sport', sport)
        .orderBy('win_pct', 'desc')
        .orderBy('ita_rank', 'asc');
      const matches = await trx('tennis_matches')
        .where('sport', sport)
        .whereNull('winner')
        .orderBy('match_date', 'asc');
      const headToHead = await trx('tennis_head_to_head')
        .where('sport', sport);

      const analysis = generateComprehensiveAnalysis(standings, matches, headToHead);

      // Clear existing seedings
      await trx('tennis_seedings')
        .where('sport', sport)
        .del();

      // Insert new seedings
      for (const [index, team] of analysis.seedings.entries()) {
        await trx('tennis_seedings').insert({
          seed: index + 1,
          team: team.team,
          record: `${team.wins}-${team.losses}`,
          win_pct: team.winPct,
          tiebreaker: team.tiebreaker || null,
          scenario_data: JSON.stringify(team.scenarioData || {}),
          sport
        });
      }
    });

    res.json({ message: 'Successfully updated match result and recalculated standings' });
  } catch (error) {
    console.error('Error updating match result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add head-to-head result
router.post('/head-to-head', async (req, res) => {
  const { team1, team2, winner, sport = 'womens-tennis' } = req.body;

  try {
    await knex.transaction(async (trx) => {
      // Add head-to-head result
      await trx('tennis_head_to_head').insert({
        team1,
        team2,
        winner,
        sport
      });

      // Recalculate seedings
      const standings = await trx('tennis_standings')
        .where('sport', sport)
        .orderBy('win_pct', 'desc')
        .orderBy('ita_rank', 'asc');
      const matches = await trx('tennis_matches')
        .where('sport', sport)
        .whereNull('winner')
        .orderBy('match_date', 'asc');
      const headToHead = await trx('tennis_head_to_head')
        .where('sport', sport);

      const analysis = generateComprehensiveAnalysis(standings, matches, headToHead);

      // Clear existing seedings
      await trx('tennis_seedings')
        .where('sport', sport)
        .del();

      // Insert new seedings
      for (const [index, team] of analysis.seedings.entries()) {
        await trx('tennis_seedings').insert({
          seed: index + 1,
          team: team.team,
          record: `${team.wins}-${team.losses}`,
          win_pct: team.winPct,
          tiebreaker: team.tiebreaker || null,
          scenario_data: JSON.stringify(team.scenarioData || {}),
          sport
        });
      }
    });

    res.json({ message: 'Successfully added head-to-head result and recalculated seedings' });
  } catch (error) {
    console.error('Error adding head-to-head result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 