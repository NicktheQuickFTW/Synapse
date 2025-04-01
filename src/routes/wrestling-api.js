/**
 * Wrestling API Routes
 * RESTful API endpoints for the FlexTime wrestling application
 */

const express = require('express');
const router = express.Router();
const knex = require('../../db/knex');

// Error handler helper
const handleError = (res, error, message = 'An error occurred') => {
  console.error(`API Error: ${message}`, error);
  res.status(500).json({ error: message, details: error.message });
};

/**
 * GET /api/wrestling/teams
 * Get all wrestling teams
 */
router.get('/teams', async (req, res) => {
  try {
    const teams = await knex('wrestling_teams')
      .select('*')
      .orderBy('name');
    
    res.json(teams);
  } catch (error) {
    handleError(res, error, 'Failed to retrieve teams');
  }
});

/**
 * GET /api/wrestling/teams/:id
 * Get a specific team by ID
 */
router.get('/teams/:id', async (req, res) => {
  try {
    const team = await knex('wrestling_teams')
      .where('id', req.params.id)
      .first();
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    handleError(res, error, `Failed to retrieve team ${req.params.id}`);
  }
});

/**
 * GET /api/wrestling/rivalries
 * Get all wrestling rivalries
 */
router.get('/rivalries', async (req, res) => {
  try {
    // Join with teams to get team names for each rivalry
    const rivalries = await knex('wrestling_rivalries')
      .select(
        'wrestling_rivalries.*',
        'team_a.name as team_a_name',
        'team_a.abbreviation as team_a_abbreviation',
        'team_b.name as team_b_name',
        'team_b.abbreviation as team_b_abbreviation'
      )
      .join('wrestling_teams as team_a', 'wrestling_rivalries.team_a_id', 'team_a.id')
      .join('wrestling_teams as team_b', 'wrestling_rivalries.team_b_id', 'team_b.id')
      .orderBy('intensity', 'desc');
    
    res.json(rivalries);
  } catch (error) {
    handleError(res, error, 'Failed to retrieve rivalries');
  }
});

/**
 * GET /api/wrestling/compass
 * Get all COMPASS data
 */
router.get('/compass', async (req, res) => {
  try {
    // Join with teams to get team names
    const compassData = await knex('wrestling_compass_data')
      .select(
        'wrestling_compass_data.*',
        'wrestling_teams.name as team_name',
        'wrestling_teams.abbreviation'
      )
      .join('wrestling_teams', 'wrestling_compass_data.team_id', 'wrestling_teams.id')
      .orderBy('composite_score', 'desc');
    
    res.json(compassData);
  } catch (error) {
    handleError(res, error, 'Failed to retrieve COMPASS data');
  }
});

/**
 * GET /api/wrestling/compass/team/:teamId
 * Get COMPASS data for a specific team
 */
router.get('/compass/team/:teamId', async (req, res) => {
  try {
    const compassData = await knex('wrestling_compass_data')
      .where('team_id', req.params.teamId)
      .join('wrestling_teams', 'wrestling_compass_data.team_id', 'wrestling_teams.id')
      .select(
        'wrestling_compass_data.*',
        'wrestling_teams.name as team_name',
        'wrestling_teams.abbreviation'
      )
      .first();
    
    if (!compassData) {
      return res.status(404).json({ error: 'COMPASS data not found for this team' });
    }
    
    res.json(compassData);
  } catch (error) {
    handleError(res, error, `Failed to retrieve COMPASS data for team ${req.params.teamId}`);
  }
});

/**
 * GET /api/wrestling/schedules
 * Get all schedules
 */
router.get('/schedules', async (req, res) => {
  try {
    const schedules = await knex('wrestling_schedules')
      .select('*')
      .orderBy('created_at', 'desc');
    
    res.json(schedules);
  } catch (error) {
    handleError(res, error, 'Failed to retrieve schedules');
  }
});

/**
 * GET /api/wrestling/schedules/:id
 * Get a specific schedule by ID
 */
router.get('/schedules/:id', async (req, res) => {
  try {
    const schedule = await knex('wrestling_schedules')
      .where('id', req.params.id)
      .first();
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json(schedule);
  } catch (error) {
    handleError(res, error, `Failed to retrieve schedule ${req.params.id}`);
  }
});

/**
 * GET /api/wrestling/schedules/:id/meets
 * Get all meets for a specific schedule
 */
router.get('/schedules/:id/meets', async (req, res) => {
  try {
    const meets = await knex('wrestling_meets')
      .where('schedule_id', req.params.id)
      .select(
        'wrestling_meets.*',
        'home.name as home_team_name',
        'home.abbreviation as home_team_abbreviation',
        'away.name as away_team_name',
        'away.abbreviation as away_team_abbreviation'
      )
      .leftJoin('wrestling_teams as home', 'wrestling_meets.home_team_id', 'home.id')
      .leftJoin('wrestling_teams as away', 'wrestling_meets.away_team_id', 'away.id')
      .orderBy('meet_date');
    
    res.json(meets);
  } catch (error) {
    handleError(res, error, `Failed to retrieve meets for schedule ${req.params.id}`);
  }
});

/**
 * POST /api/wrestling/schedules
 * Create a new schedule
 */
router.post('/schedules', async (req, res) => {
  try {
    // Validate request body
    const requiredFields = ['name', 'season_start', 'season_end'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }
    
    // Create the schedule
    const [scheduleId] = await knex('wrestling_schedules')
      .insert({
        name: req.body.name,
        season_start: req.body.season_start,
        season_end: req.body.season_end,
        meets_per_team: req.body.meets_per_team || 8,
        description: req.body.description,
        parameters: req.body.parameters,
        schedule_data: req.body.schedule_data,
        metrics: req.body.metrics,
        is_active: req.body.is_active || false,
        is_finalized: req.body.is_finalized || false,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('id');
    
    // If meets are provided, create them
    if (req.body.meets && Array.isArray(req.body.meets) && req.body.meets.length > 0) {
      const meetsToInsert = req.body.meets.map(meet => ({
        schedule_id: scheduleId,
        home_team_id: meet.home_team_id,
        away_team_id: meet.away_team_id,
        meet_date: meet.meet_date,
        meet_time: meet.meet_time,
        venue: meet.venue,
        location: meet.location,
        is_rivalry: meet.is_rivalry || false,
        is_confirmed: meet.is_confirmed || false,
        created_at: new Date(),
        updated_at: new Date()
      }));
      
      await knex('wrestling_meets').insert(meetsToInsert);
    }
    
    // Return the created schedule
    const createdSchedule = await knex('wrestling_schedules')
      .where('id', scheduleId)
      .first();
    
    res.status(201).json(createdSchedule);
  } catch (error) {
    handleError(res, error, 'Failed to create schedule');
  }
});

/**
 * PUT /api/wrestling/schedules/:id
 * Update an existing schedule
 */
router.put('/schedules/:id', async (req, res) => {
  try {
    // Check if schedule exists
    const schedule = await knex('wrestling_schedules')
      .where('id', req.params.id)
      .first();
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Update the schedule
    await knex('wrestling_schedules')
      .where('id', req.params.id)
      .update({
        name: req.body.name || schedule.name,
        season_start: req.body.season_start || schedule.season_start,
        season_end: req.body.season_end || schedule.season_end,
        meets_per_team: req.body.meets_per_team || schedule.meets_per_team,
        description: req.body.description || schedule.description,
        parameters: req.body.parameters || schedule.parameters,
        schedule_data: req.body.schedule_data || schedule.schedule_data,
        metrics: req.body.metrics || schedule.metrics,
        is_active: req.body.is_active !== undefined ? req.body.is_active : schedule.is_active,
        is_finalized: req.body.is_finalized !== undefined ? req.body.is_finalized : schedule.is_finalized,
        updated_at: new Date()
      });
    
    // If meets are provided, replace all existing meets
    if (req.body.meets && Array.isArray(req.body.meets)) {
      // Delete existing meets
      await knex('wrestling_meets')
        .where('schedule_id', req.params.id)
        .del();
      
      // Insert new meets
      if (req.body.meets.length > 0) {
        const meetsToInsert = req.body.meets.map(meet => ({
          schedule_id: req.params.id,
          home_team_id: meet.home_team_id,
          away_team_id: meet.away_team_id,
          meet_date: meet.meet_date,
          meet_time: meet.meet_time,
          venue: meet.venue,
          location: meet.location,
          is_rivalry: meet.is_rivalry || false,
          is_confirmed: meet.is_confirmed || false,
          created_at: new Date(),
          updated_at: new Date()
        }));
        
        await knex('wrestling_meets').insert(meetsToInsert);
      }
    }
    
    // Return the updated schedule
    const updatedSchedule = await knex('wrestling_schedules')
      .where('id', req.params.id)
      .first();
    
    res.json(updatedSchedule);
  } catch (error) {
    handleError(res, error, `Failed to update schedule ${req.params.id}`);
  }
});

/**
 * POST /api/wrestling/schedules/generate
 * Generate a new schedule using AI optimization
 */
router.post('/schedules/generate', async (req, res) => {
  try {
    // This would typically call a service that runs the AI schedule generation
    // For now, we'll just create a placeholder that would be filled by the actual implementation
    
    // Return a message indicating the schedule will be generated asynchronously
    res.json({
      message: 'Schedule generation has been initiated',
      parameters: req.body,
      estimated_completion_time: '30 seconds'
    });
    
    // In a real implementation, this would trigger a background job
    // that handles the schedule generation
  } catch (error) {
    handleError(res, error, 'Failed to initiate schedule generation');
  }
});

/**
 * GET /api/wrestling/constraints
 * Get all schedule constraints
 */
router.get('/constraints', async (req, res) => {
  try {
    const constraints = await knex('wrestling_schedule_constraints')
      .select(
        'wrestling_schedule_constraints.*',
        'wrestling_teams.name as team_name',
        'wrestling_teams.abbreviation'
      )
      .leftJoin('wrestling_teams', 'wrestling_schedule_constraints.team_id', 'wrestling_teams.id')
      .where('is_active', true)
      .orderBy('start_date');
    
    res.json(constraints);
  } catch (error) {
    handleError(res, error, 'Failed to retrieve constraints');
  }
});

/**
 * POST /api/wrestling/constraints
 * Create a new schedule constraint
 */
router.post('/constraints', async (req, res) => {
  try {
    // Validate request body
    if (!req.body.constraint_type) {
      return res.status(400).json({ error: 'Missing required field: constraint_type' });
    }
    
    // Create the constraint
    const [constraintId] = await knex('wrestling_schedule_constraints')
      .insert({
        team_id: req.body.team_id,
        constraint_type: req.body.constraint_type,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        description: req.body.description,
        constraint_data: req.body.constraint_data,
        is_active: req.body.is_active !== undefined ? req.body.is_active : true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('id');
    
    // Return the created constraint
    const createdConstraint = await knex('wrestling_schedule_constraints')
      .where('id', constraintId)
      .first();
    
    res.status(201).json(createdConstraint);
  } catch (error) {
    handleError(res, error, 'Failed to create constraint');
  }
});

/**
 * DELETE /api/wrestling/constraints/:id
 * Delete a schedule constraint (soft delete by setting is_active to false)
 */
router.delete('/constraints/:id', async (req, res) => {
  try {
    // Check if constraint exists
    const constraint = await knex('wrestling_schedule_constraints')
      .where('id', req.params.id)
      .first();
    
    if (!constraint) {
      return res.status(404).json({ error: 'Constraint not found' });
    }
    
    // Soft delete by setting is_active to false
    await knex('wrestling_schedule_constraints')
      .where('id', req.params.id)
      .update({
        is_active: false,
        updated_at: new Date()
      });
    
    res.json({ success: true, message: 'Constraint deactivated successfully' });
  } catch (error) {
    handleError(res, error, `Failed to delete constraint ${req.params.id}`);
  }
});

module.exports = router; 