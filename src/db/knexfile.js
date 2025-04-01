module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './tennis.db'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    }
  }
}; 