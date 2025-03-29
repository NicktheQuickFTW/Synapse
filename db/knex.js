/**
 * Mock Knex connection for testing purposes
 */

// Mock function for knex
const knex = function(table) {
  console.log(`Mock DB operation on table: ${table}`);
  
  const mockQuery = {
    select: (...fields) => {
      console.log(`SELECT ${fields.join(', ')} FROM ${table}`);
      return mockQuery;
    },
    where: (condition) => {
      console.log(`WHERE condition on ${table}:`, condition);
      return mockQuery;
    },
    first: () => {
      console.log(`FIRST result from ${table}`);
      return Promise.resolve(null);
    },
    update: (data) => {
      console.log(`UPDATE ${table} WITH:`, data);
      return mockQuery;
    },
    insert: (data) => {
      console.log(`INSERT INTO ${table}:`, data);
      return mockQuery;
    },
    returning: (fields) => {
      console.log(`RETURNING ${fields} FROM ${table}`);
      
      // Handle different tables
      if (table === 'sport_metadata') {
        return Promise.resolve([{
          sport_id: 1,
          sport_name: 'basketball',
          schema_version: '1.0.0',
          last_updated: new Date(),
          claude_model_version: 'claude-3-opus'
        }]);
      } else if (table === 'agent_registry') {
        return Promise.resolve([{
          agent_id: '123e4567-e89b-12d3-a456-426614174000',
          sport_id: 1,
          agent_type: 'big12manual-MBB-agent',
          capabilities: JSON.stringify({
            clustering: true,
            scheduling: true,
            optimization: true,
            analysis: true
          }),
          last_ping: new Date(),
          updated_at: new Date()
        }]);
      }
      
      return Promise.resolve([]);
    },
    orderBy: (field, direction) => {
      console.log(`ORDER BY ${field} ${direction}`);
      
      // Return mock data
      if (table === 'sport_metadata') {
        return Promise.resolve([{
          sport_id: 1,
          sport_name: 'basketball',
          schema_version: '1.0.0',
          last_updated: new Date(),
          claude_model_version: 'claude-3-opus'
        }]);
      } else if (table === 'agent_registry') {
        return Promise.resolve([{
          agent_id: '123e4567-e89b-12d3-a456-426614174000',
          sport_id: 1,
          agent_type: 'scheduling',
          capabilities: '{"clustering":true,"scheduling":true,"optimization":true,"analysis":true}',
          is_active: true,
          last_ping: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }]);
      }
      
      return Promise.resolve([]);
    }
  };
  
  return mockQuery;
};

// Add functions to knex
knex.fn = {
  now: () => {
    return new Date();
  }
};

// Add mock destroy function
knex.destroy = () => {
  console.log('Mock DB connection closed');
  return Promise.resolve();
};

module.exports = knex; 