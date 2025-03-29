/**
 * Seed file for sport_metadata table
 */
exports.seed = async function(knex) {
  // Delete existing entries
  await knex('sport_metadata').del();
  
  // Insert seed entries
  await knex('sport_metadata').insert([
    {
      sport_name: 'basketball',
      schema_version: '1.0.0',
      last_updated: new Date(),
      claude_model_version: 'claude-3-opus-20240229'
    },
    {
      sport_name: 'football',
      schema_version: '1.0.0',
      last_updated: new Date(),
      claude_model_version: 'claude-3-opus-20240229'
    },
    {
      sport_name: 'baseball',
      schema_version: '1.0.0',
      last_updated: new Date(), 
      claude_model_version: 'claude-3-opus-20240229'
    },
    {
      sport_name: 'volleyball',
      schema_version: '1.0.0',
      last_updated: new Date(),
      claude_model_version: 'claude-3-opus-20240229'
    },
    {
      sport_name: 'soccer',
      schema_version: '1.0.0',
      last_updated: new Date(),
      claude_model_version: 'claude-3-opus-20240229'
    }
  ]);
}; 