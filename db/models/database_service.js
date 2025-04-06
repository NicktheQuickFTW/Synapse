const { Pool } = require('pg');
const { logger } = require('../utils/logger');

class DatabaseService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });
    }

    async initialize() {
        try {
            // Test the connection
            await this.pool.query('SELECT NOW()');
            logger.info('Database connection established successfully');
        } catch (error) {
            logger.error('Failed to connect to database:', error);
            throw error;
        }
    }

    async syncTransferData(transferData) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Update or insert players
            for (const player of transferData.players) {
                const query = `
                    INSERT INTO players (
                        name, position, height, weight, previous_school,
                        eligibility, class_year, status, stats, metadata
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (name) DO UPDATE SET
                        position = EXCLUDED.position,
                        height = EXCLUDED.height,
                        weight = EXCLUDED.weight,
                        previous_school = EXCLUDED.previous_school,
                        eligibility = EXCLUDED.eligibility,
                        class_year = EXCLUDED.class_year,
                        status = EXCLUDED.status,
                        stats = EXCLUDED.stats,
                        metadata = EXCLUDED.metadata,
                        updated_at = NOW()
                `;

                const values = [
                    player.name,
                    player.position,
                    player.height,
                    player.weight,
                    player.previous_school,
                    player.eligibility,
                    player.class_year,
                    player.status,
                    JSON.stringify(player.stats),
                    JSON.stringify({
                        transfer_date: player.transfer_date,
                        destination_school: player.destination_school,
                        ranking: player.ranking,
                        profile_url: player.profile_url,
                        nil_valuation: player.nil_valuation
                    })
                ];

                await client.query(query, values);
            }

            await client.query('COMMIT');
            logger.info(`Successfully synced ${transferData.players.length} players to database`);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Failed to sync transfer data:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async getTransferPlayers(filters = {}) {
        const query = `
            SELECT * FROM players
            WHERE 1=1
            ${filters.position ? 'AND position ILIKE $1' : ''}
            ${filters.school ? 'AND (previous_school ILIKE $2 OR metadata->>'destination_school' ILIKE $2)' : ''}
            ${filters.status ? 'AND status ILIKE $3' : ''}
            ${filters.min_ppg ? 'AND (stats->>'ppg')::float >= $4' : ''}
            ORDER BY (metadata->>'ranking')::int DESC NULLS LAST,
                     (stats->>'ppg')::float DESC NULLS LAST
            LIMIT $5
        `;

        const values = [
            filters.position ? `%${filters.position}%` : null,
            filters.school ? `%${filters.school}%` : null,
            filters.status ? `%${filters.status}%` : null,
            filters.min_ppg || null,
            filters.limit || 20
        ].filter(v => v !== null);

        const result = await this.pool.query(query, values);
        return result.rows;
    }

    async close() {
        await this.pool.end();
        logger.info('Database connection closed');
    }
}

module.exports = { DatabaseService }; 