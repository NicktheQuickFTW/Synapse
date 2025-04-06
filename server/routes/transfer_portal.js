const express = require('express');
const router = express.Router();
const knex = require('../../db/utils/db');

// Validate database connection
const validateDbConnection = async () => {
  try {
    await knex.raw('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection error:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    return false;
  }
};

// Error handler middleware
const errorHandler = (error, req, res, next) => {
  console.error('Transfer portal error:', {
    message: error.message,
    code: error.code,
    detail: error.detail,
    stack: error.stack
  });
  
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Database connection failed',
      details: 'Unable to connect to the database. Please try again later.'
    });
  }
  
  if (error.code === '42P01') {
    return res.status(500).json({
      error: 'Database schema error',
      details: 'Required tables are missing. Please ensure migrations have been run.'
    });
  }

  if (error.code === '28P01') {
    return res.status(500).json({
      error: 'Authentication failed',
      details: 'Database credentials are invalid.'
    });
  }

  if (error.code === '28000') {
    return res.status(500).json({
      error: 'SSL connection required',
      details: 'A secure SSL connection is required for the database.'
    });
  }

  if (error.code === 'ETIMEDOUT') {
    return res.status(503).json({
      error: 'Connection timeout',
      details: 'The database connection timed out. Please try again.'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    code: error.code
  });
};

// Connection check middleware with retry
const checkDbConnection = async (req, res, next) => {
  let retries = 3;
  let connected = false;

  while (retries > 0 && !connected) {
    connected = await validateDbConnection();
    if (!connected) {
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }
  }

  if (!connected) {
    return res.status(503).json({
      error: 'Service unavailable',
      details: 'Database connection is not available after multiple attempts'
    });
  }
  next();
};

// Apply middleware to all routes
router.use(checkDbConnection);

/**
 * GET /api/transfer-portal
 * Get all transfer portal entries with optional filters
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      status,
      position,
      eligibility,
      transfer_type,
      min_ppg,
      min_rpg,
      min_apg,
      sort_by,
      sort_order = 'desc',
      page = 1,
      limit = 25
    } = req.query;

    // Validate numeric parameters
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 25));

    let query = knex('transfer_portal')
      .select('*');

    // Validate and apply filters
    if (status && ['Available', 'Committed', 'Withdrawn'].includes(status)) {
      query.where('status', status);
    }
    
    if (position && ['PG', 'SG', 'SF', 'PF', 'C'].includes(position)) {
      query.where('position', position);
    }
    
    if (eligibility) query.where('eligibility', eligibility);
    if (transfer_type) query.where('transfer_type', transfer_type);

    // Validate numeric filters
    if (min_ppg && !isNaN(min_ppg)) {
      query.whereRaw("(stats->>'points_per_game')::float >= ?", [parseFloat(min_ppg)]);
    }
    if (min_rpg && !isNaN(min_rpg)) {
      query.whereRaw("(stats->>'rebounds_per_game')::float >= ?", [parseFloat(min_rpg)]);
    }
    if (min_apg && !isNaN(min_apg)) {
      query.whereRaw("(stats->>'assists_per_game')::float >= ?", [parseFloat(min_apg)]);
    }

    // Validate and apply sorting
    const validSortFields = ['entry_date', 'updated_at', 'status', 'position'];
    const validSortOrders = ['asc', 'desc'];
    
    if (sort_by) {
      if (sort_by.startsWith('stats.')) {
        const statField = sort_by.split('.')[1];
        const validStatFields = ['points_per_game', 'rebounds_per_game', 'assists_per_game'];
        if (validStatFields.includes(statField)) {
          query.orderByRaw(`(stats->>'${statField}')::float ${validSortOrders.includes(sort_order) ? sort_order : 'desc'}`);
        }
      } else if (validSortFields.includes(sort_by)) {
        query.orderBy(sort_by, validSortOrders.includes(sort_order) ? sort_order : 'desc');
      }
    } else {
      query.orderBy('entry_date', 'desc');
    }

    // Apply pagination
    const offset = (validatedPage - 1) * validatedLimit;
    query.offset(offset).limit(validatedLimit);

    // Execute query with timeout
    const [results, total] = await Promise.all([
      query.timeout(5000),
      knex('transfer_portal').count('id').first().timeout(5000)
    ]);

    if (!results || !total) {
      throw new Error('Failed to fetch transfer portal data');
    }

    res.json({
      data: results,
      pagination: {
        current_page: validatedPage,
        total_pages: Math.ceil(parseInt(total.count) / validatedLimit),
        total_entries: parseInt(total.count),
        per_page: validatedLimit
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/transfer-portal/stats
 * Get transfer portal statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // First, get the total count to ensure we have data
    const totalCount = await knex('transfer_portal').count('id as count').first();
    
    if (!totalCount || parseInt(totalCount.count) === 0) {
      return res.json({
        summary: {
          total_transfers: "0",
          available_transfers: "0",
          committed_transfers: "0",
          withdrawn_transfers: "0"
        },
        distributions: {
          status: [],
          position: [],
          eligibility: []
        },
        averageStats: null,
        topPerformers: [],
        recentActivity: []
      });
    }

    const [summary, statusDistribution, positionDistribution, eligibilityDistribution] = await Promise.all([
      // Summary statistics
      knex('transfer_portal')
        .select(
          knex.raw('COUNT(*) as total_transfers'),
          knex.raw('COUNT(CASE WHEN status = \'Available\' THEN 1 END) as available_transfers'),
          knex.raw('COUNT(CASE WHEN status = \'Committed\' THEN 1 END) as committed_transfers'),
          knex.raw('COUNT(CASE WHEN status = \'Withdrawn\' THEN 1 END) as withdrawn_transfers')
        )
        .first(),

      // Status distribution
      knex('transfer_portal')
        .select('status')
        .count('* as count')
        .groupBy('status'),

      // Position distribution
      knex('transfer_portal')
        .select('position')
        .count('* as count')
        .whereNotNull('position')
        .groupBy('position'),

      // Eligibility distribution
      knex('transfer_portal')
        .select('eligibility')
        .count('* as count')
        .whereNotNull('eligibility')
        .groupBy('eligibility')
    ]);

    // Get average stats for available transfers
    const averageStats = await knex('transfer_portal')
      .select(
        knex.raw('AVG((stats->>\'points_per_game\')::float) as avg_ppg'),
        knex.raw('AVG((stats->>\'rebounds_per_game\')::float) as avg_rpg'),
        knex.raw('AVG((stats->>\'assists_per_game\')::float) as avg_apg'),
        knex.raw('AVG((stats->>\'field_goal_percentage\')::float) as avg_fg_pct'),
        knex.raw('AVG((stats->>\'three_point_percentage\')::float) as avg_three_pct')
      )
      .where('status', 'Available')
      .whereNotNull('stats')
      .first();

    // Get top performers based on points per game
    const topPerformers = await knex('transfer_portal')
      .select(
        'id',
        'player_id',
        'position',
        'eligibility',
        'status',
        'stats'
      )
      .whereNotNull('stats')
      .orderBy(knex.raw('(stats->>\'points_per_game\')::float'), 'desc')
      .limit(10);

    // Get recent activity (last 30 days)
    const recentActivity = await knex('transfer_portal')
      .select('*')
      .where('updated_at', '>', knex.raw('now() - interval \'30 days\''))
      .orderBy('updated_at', 'desc')
      .limit(10);

    // Calculate percentages for distributions
    const calculatePercentage = (distribution, total) => {
      return distribution.map(item => ({
        ...item,
        percentage: parseFloat(((parseInt(item.count) / total) * 100).toFixed(1))
      }));
    };

    const response = {
      summary,
      distributions: {
        status: calculatePercentage(statusDistribution, summary.total_transfers),
        position: calculatePercentage(positionDistribution, summary.total_transfers),
        eligibility: calculatePercentage(eligibilityDistribution, summary.total_transfers)
      },
      averageStats,
      topPerformers,
      recentActivity
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching transfer portal statistics:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    
    // Send a more specific error response
    res.status(500).json({
      error: 'Failed to fetch transfer portal statistics',
      details: error.message,
      code: error.code
    });
  }
});

/**
 * GET /api/transfer-portal/trending
 * Get trending transfers based on recent activity
 */
router.get('/trending', async (req, res) => {
  try {
    const recentTransfers = await knex('transfer_portal')
      .select('*')
      .where('updated_at', '>', knex.raw("now() - interval '7 days'"))
      .orderBy('updated_at', 'desc')
      .limit(10);

    res.json(recentTransfers);
  } catch (error) {
    console.error('Error fetching trending transfers:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      code: error.code
    });
  }
});

/**
 * GET /api/transfer-portal/search
 * Search transfers by various criteria
 */
router.get('/search', async (req, res) => {
  try {
    const { query, position, status, eligibility } = req.query;
    
    const baseQuery = knex('transfer_portal')
      .select('*');

    // Apply filters
    if (query) {
      baseQuery.where(function() {
        this.where('position', 'ilike', `%${query}%`)
          .orWhere('eligibility', 'ilike', `%${query}%`)
          .orWhere('hometown', 'ilike', `%${query}%`)
          .orWhere('high_school', 'ilike', `%${query}%`);
      });
    }

    if (position) {
      baseQuery.where('position', position);
    }

    if (status) {
      baseQuery.where('status', status);
    }

    if (eligibility) {
      baseQuery.where('eligibility', eligibility);
    }

    const results = await baseQuery
      .orderBy('entry_date', 'desc')
      .limit(25);

    res.json(results);
  } catch (error) {
    console.error('Error searching transfers:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      code: error.code
    });
  }
});

/**
 * GET /api/transfer-portal/compare
 * Compare two or more players
 */
router.get('/compare', async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ error: 'Player IDs are required' });
    }

    const playerIds = ids.split(',').map(id => parseInt(id));
    
    const players = await knex('transfer_portal')
      .select(
        'id',
        'player_id',
        'position',
        'eligibility',
        'status',
        'entry_date',
        'stats',
        'height',
        'weight',
        'hometown',
        'high_school',
        'transfer_type',
        'years_remaining'
      )
      .whereIn('id', playerIds);

    if (players.length === 0) {
      return res.status(404).json({ error: 'No players found' });
    }

    res.json(players);
  } catch (error) {
    console.error('Error comparing players:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      code: error.code
    });
  }
});

/**
 * GET /api/transfer-portal/team-analysis
 * Get detailed analysis of transfers for a specific team
 */
router.get('/team-analysis', async (req, res) => {
  try {
    const { team_id } = req.query;
    
    if (!team_id) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const [teamStats, transfers] = await Promise.all([
      // Get team transfer statistics
      knex('transfer_portal')
        .select(
          knex.raw('COUNT(*) as total_transfers'),
          knex.raw('COUNT(CASE WHEN status = \'Available\' THEN 1 END) as available_transfers'),
          knex.raw('COUNT(CASE WHEN status = \'Committed\' THEN 1 END) as committed_transfers'),
          knex.raw('COUNT(CASE WHEN status = \'Withdrawn\' THEN 1 END) as withdrawn_transfers'),
          knex.raw('AVG((stats->>\'points_per_game\')::float) as avg_ppg'),
          knex.raw('AVG((stats->>\'rebounds_per_game\')::float) as avg_rpg'),
          knex.raw('AVG((stats->>\'assists_per_game\')::float) as avg_apg')
        )
        .where('previous_team_id', team_id)
        .first(),

      // Get detailed transfer information
      knex('transfer_portal')
        .select(
          'id',
          'player_id',
          'position',
          'status',
          'entry_date',
          'commitment_date',
          'withdrawal_date',
          'new_team_id',
          'stats',
          'eligibility',
          'transfer_type'
        )
        .where('previous_team_id', team_id)
        .orderBy('entry_date', 'desc')
    ]);

    if (!teamStats.total_transfers) {
      return res.status(404).json({ error: 'Team not found or no transfers available' });
    }

    res.json({
      team_stats: teamStats,
      transfers: transfers
    });
  } catch (error) {
    console.error('Error analyzing team transfers:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      code: error.code
    });
  }
});

/**
 * GET /api/transfer-portal/predictions
 * Get transfer predictions based on historical data
 */
router.get('/predictions', async (req, res) => {
  try {
    const { team_id, position } = req.query;
    
    if (!team_id) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    // Get team's historical transfer patterns
    const historicalTransfers = await knex('transfer_portal')
      .select(
        'position',
        'transfer_type',
        'eligibility',
        knex.raw('(stats->>\'points_per_game\')::float as ppg'),
        knex.raw('(stats->>\'rebounds_per_game\')::float as rpg'),
        knex.raw('(stats->>\'assists_per_game\')::float as apg')
      )
      .where('previous_team_id', team_id)
      .where('status', 'Committed');

    // Get current team needs based on position
    const teamNeeds = await knex('transfer_portal')
      .select(
        'position',
        knex.raw('COUNT(*) as position_count')
      )
      .where('previous_team_id', team_id)
      .where('status', 'Available')
      .groupBy('position');

    // Get potential transfer targets
    const potentialTargets = await knex('transfer_portal')
      .select(
        'id',
        'player_id',
        'position',
        'eligibility',
        'stats',
        'transfer_type',
        'years_remaining'
      )
      .where('status', 'Available')
      .whereNot('previous_team_id', team_id)
      .modify(function(queryBuilder) {
        if (position) {
          queryBuilder.where('position', position);
        }
      })
      .orderBy(knex.raw('(stats->>\'points_per_game\')::float'), 'desc')
      .limit(10);

    res.json({
      historical_patterns: historicalTransfers,
      team_needs: teamNeeds,
      potential_targets: potentialTargets
    });
  } catch (error) {
    console.error('Error generating transfer predictions:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      code: error.code
    });
  }
});

// Apply error handler
router.use(errorHandler);

module.exports = router; 