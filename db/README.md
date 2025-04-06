# Database Organization

This directory contains all database-related files and configurations for the XII-OS project.

## Directory Structure

```
db/
├── migrations/     # Database migration files
├── seeds/         # Seed data files for development
├── models/        # Database models and schemas
├── schemas/       # SQL schema definitions
├── scripts/       # Database utility scripts
└── README.md      # This file
```

## Components

### Migrations
- Contains Knex.js migration files
- Each migration file should be timestamped and describe a single schema change
- Example: `YYYYMMDDHHMMSS_create_users_table.js`

### Seeds
- Contains seed data for development and testing
- Organized by feature or domain
- Example: `users_seed.js`, `tennis_data_seed.js`

### Models
- Database models and ORM definitions
- Organized by domain/feature
- Example: `user_model.js`, `tennis_match_model.js`

### Schemas
- Raw SQL schema definitions
- Used for reference and documentation
- Example: `users_schema.sql`, `tennis_matches_schema.sql`

### Scripts
- Utility scripts for database operations
- Backup/restore scripts
- Data migration scripts
- Example: `backup_db.sh`, `reset_db.js`

## Database Configuration

The project uses PostgreSQL with the following configurations:
- Development: `config/database.js`
- Production: Environment variables

### Connection Settings
- Host: `DB_HOST`
- Port: `DB_PORT`
- Database: `DB_NAME`
- User: `DB_USER`
- Password: `DB_PASSWORD`

## Best Practices

1. **Migrations**
   - Always create new migrations for schema changes
   - Never modify existing migrations
   - Include both up and down migrations

2. **Models**
   - Keep models focused and single-responsibility
   - Use appropriate indexes
   - Include validation rules

3. **Seeds**
   - Keep seed data minimal and focused
   - Use realistic but safe data
   - Include cleanup procedures

4. **Scripts**
   - Document all scripts
   - Include error handling
   - Use environment variables for sensitive data

## Tools Used

- **Node.js**: Knex.js for migrations and query building
- **Python**: psycopg2 for PostgreSQL connections
- **ORM**: Custom models with Knex.js

## Getting Started

1. Set up environment variables
2. Run migrations: `npm run migrate`
3. Seed development data: `npm run seed`
4. Verify connection: `npm run db:test` 