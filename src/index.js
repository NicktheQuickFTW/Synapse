require('dotenv').config();
const { DatabaseService } = require('./services/database');
const { TransferPortalService } = require('./services/transferPortal');
const { logger } = require('./utils/logger');
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App.jsx';
import './index.css';

class BasketballTransferPortalAgent {
    constructor() {
        this.databaseService = new DatabaseService();
        this.transferPortalService = new TransferPortalService();
        this.lastRefresh = null;
        this.cacheExpiry = 60 * 60 * 1000; // 1 hour in milliseconds
    }

    async initialize() {
        try {
            await this.databaseService.initialize();
            await this.transferPortalService.initialize();
            logger.info('Basketball Transfer Portal Agent initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize agent:', error);
            throw error;
        }
    }

    async refreshData() {
        try {
            logger.info('Starting data refresh...');
            const transferData = await this.transferPortalService.getTransferData();
            await this.databaseService.syncTransferData(transferData);
            this.lastRefresh = Date.now();
            logger.info('Data refresh completed successfully');
            return transferData;
        } catch (error) {
            logger.error('Failed to refresh data:', error);
            throw error;
        }
    }

    async refreshIfNeeded() {
        const now = Date.now();
        if (!this.lastRefresh || (now - this.lastRefresh) > this.cacheExpiry) {
            await this.refreshData();
        }
    }

    async start() {
        try {
            await this.initialize();
            await this.refreshData();
            
            // Set up periodic refresh
            setInterval(() => this.refreshIfNeeded(), this.cacheExpiry);
            
            logger.info('Agent started successfully');
        } catch (error) {
            logger.error('Failed to start agent:', error);
            process.exit(1);
        }
    }

    async close() {
        await this.databaseService.close();
        logger.info('Agent stopped successfully');
    }
}

// Start the agent
const agent = new BasketballTransferPortalAgent();
agent.start().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM signal');
    await agent.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('Received SIGINT signal');
    await agent.close();
    process.exit(0);
});

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 