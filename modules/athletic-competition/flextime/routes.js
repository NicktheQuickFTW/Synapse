/**
 * Athletic Competition Routes
 * 
 * These routes handle athletic competition related API endpoints.
 */

const express = require('express');
const router = express.Router();
const controllers = require('./controllers');
const sportMetadata = require('../sport-metadata');

// FlexTime routes
router.post('/flextime', controllers.generateSchedule);
router.get('/flextime', controllers.listSchedules);
router.get('/flextime/:scheduleId', controllers.loadScheduleFromDatabase);

// FlexTime operations
router.post('/flextime/validate', controllers.validateSchedule);
router.post('/flextime/optimize', controllers.optimizeSchedule);
router.post('/flextime/analyze', controllers.getClaudeAnalysis);

// Database operations
router.post('/flextime/save', controllers.saveScheduleToDatabase);
router.post('/configurations', controllers.saveConfigurationToDatabase);
router.get('/configurations', controllers.listConfigurations);
router.get('/configurations/:configId', controllers.loadConfigurationFromDatabase);

// FlexTime engine direct calls
router.post('/flextime-engine/generate', controllers.generateSchedule);
router.post('/flextime-engine/optimize', controllers.optimizeSchedule);
router.post('/flextime-engine/validate', controllers.validateSchedule);

// Postseason-related routes
router.get('/postseason', controllers.getPostseasonProjections);
router.post('/postseason/simulate', controllers.simulatePostseason);

// Conflict resolution
router.get('/conflicts', controllers.getConflicts);
router.post('/conflicts/resolve', controllers.resolveConflict);

// FlexTime scheduling routes
router.get('/schedules', controllers.getSchedule);
router.post('/schedules', controllers.createSchedule);
router.put('/schedules/:id', controllers.updateSchedule);
router.delete('/schedules/:id', controllers.deleteSchedule);

// Postseason optimization routes
router.get('/postseason', controllers.getPostseasonScenarios);

// Sport metadata routes
router.get('/metadata/sports', async (req, res) => {
  try {
    const sports = await sportMetadata.getSports();
    res.status(200).json({ success: true, data: sports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/metadata/sports', async (req, res) => {
  try {
    const sport = await sportMetadata.registerSport(req.body);
    res.status(201).json({ success: true, data: sport });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Basketball resources routes
router.get('/resources/basketball', async (req, res) => {
  try {
    const games = await sportMetadata.getBasketballGames(req.query);
    res.status(200).json({ success: true, data: games });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/resources/basketball', async (req, res) => {
  try {
    const game = await sportMetadata.registerBasketballGame(req.body);
    res.status(201).json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Agent registry routes
router.get('/agents', async (req, res) => {
  try {
    const agents = await sportMetadata.getAgents(req.query);
    res.status(200).json({ success: true, data: agents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/agents', async (req, res) => {
  try {
    const agent = await sportMetadata.registerAgent(req.body);
    res.status(201).json({ success: true, data: agent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/agents/:id/ping', async (req, res) => {
  try {
    const agent = await sportMetadata.updateAgentPing(req.params.id);
    res.status(200).json({ success: true, data: agent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
