const axios = require('axios');
const cheerio = require('cheerio');
const { logger } = require('../utils/logger');

class TransferPortalService {
    constructor() {
        this.baseUrl = 'https://www.on3.com/transfer-portal/wire/basketball/';
        this.topPlayersUrl = 'https://www.on3.com/transfer-portal/industry/basketball/';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'sec-ch-ua': '"Not A;Brand";v="99", "Chromium";v="121"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"'
        };
    }

    async initialize() {
        try {
            // Test the connection
            await axios.get(this.baseUrl, { headers: this.headers });
            logger.info('Transfer portal service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize transfer portal service:', error);
            throw error;
        }
    }

    async getTransferData() {
        try {
            logger.info('Fetching transfer portal data...');
            
            // Fetch main transfer portal page
            const mainResponse = await axios.get(this.baseUrl, { headers: this.headers });
            const mainPlayers = await this._extractPlayersFromPage(mainResponse.data);
            
            // Fetch top players page
            const topResponse = await axios.get(this.topPlayersUrl, { headers: this.headers });
            const topPlayers = await this._extractPlayersFromPage(topResponse.data, true);
            
            // Merge the data
            const mergedPlayers = this._mergePlayerLists(mainPlayers, topPlayers);
            
            return {
                last_updated: new Date().toISOString(),
                players: mergedPlayers
            };
        } catch (error) {
            logger.error('Failed to fetch transfer data:', error);
            throw error;
        }
    }

    async _extractPlayersFromPage(html, includeRanking = false) {
        const $ = cheerio.load(html);
        const players = [];

        $('.transfer-portal-card').each((i, card) => {
            try {
                const $card = $(card);
                
                // Extract basic info
                const name = $card.find('.player-name').text().trim();
                const detailsText = $card.find('.player-details').text().trim();
                
                // Parse details
                const details = detailsText.split('•').map(d => d.trim());
                const position = details[0] || null;
                const height = details[1] || null;
                const classYear = details[2] || null;
                
                // Extract school info
                const previousSchool = $card.find('.player-school').text().trim() || null;
                
                // Extract stats
                const statsText = $card.find('.player-stats').text().trim();
                const stats = this._parseStats(statsText);
                
                // Extract profile URL
                const profileUrl = $card.find('a').attr('href') || null;
                
                // Extract ranking if needed
                const ranking = includeRanking ? 
                    this._parseRanking($card.find('.player-ranking').text()) : null;
                
                // Create player object
                const player = {
                    name,
                    position,
                    height,
                    class_year: classYear,
                    previous_school: previousSchool,
                    stats,
                    ranking,
                    profile_url: profileUrl,
                    transfer_date: new Date().toISOString(),
                    status: 'in portal',
                    destination_school: null
                };
                
                players.push(player);
            } catch (error) {
                logger.error(`Error extracting player ${i}:`, error);
            }
        });
        
        return players;
    }

    _parseStats(statsText) {
        const stats = {};
        const parts = statsText.split('/');
        
        parts.forEach(part => {
            const [value, label] = part.trim().split(' ');
            if (value && label) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    stats[label.toLowerCase()] = numValue;
                }
            }
        });
        
        return stats;
    }

    _parseRanking(rankingText) {
        const match = rankingText.match(/#(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    _mergePlayerLists(mainList, topList) {
        const playerMap = new Map(mainList.map(p => [p.name, p]));
        
        topList.forEach(topPlayer => {
            if (playerMap.has(topPlayer.name)) {
                // Update existing player with new information
                const existingPlayer = playerMap.get(topPlayer.name);
                Object.assign(existingPlayer, topPlayer);
            } else {
                // Add new player
                playerMap.set(topPlayer.name, topPlayer);
            }
        });
        
        return Array.from(playerMap.values());
    }
}

module.exports = { TransferPortalService }; 