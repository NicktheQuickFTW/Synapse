const axios = require('axios');
const cheerio = require('cheerio');
const knex = require('../db/knex');
require('dotenv').config();

async function fetchStandings() {
    try {
        const response = await axios.get('https://big12sports.com/standings.aspx?path=wten', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.data) {
            throw new Error('No data received from the website');
        }

        const $ = cheerio.load(response.data);
        const standings = [];

        // Find the standings table
        $('table.sidearm-table tr:not(.header)').each((i, row) => {
            const columns = $(row).find('td');
            if (columns.length >= 4) {
                const team = $(columns[1]).text().trim();
                const confRecord = $(columns[2]).text().trim();
                const overallRecord = $(columns[4]).text().trim();
                const streak = $(columns[5]).text().trim();

                if (team && confRecord) {
                    const [confWins, confLosses] = confRecord.split('-').map(Number);
                    const [overallWins, overallLosses] = overallRecord.split('-').map(Number);
                    const winPercent = overallWins / (overallWins + overallLosses);

                    standings.push({
                        team,
                        conf_wins: confWins,
                        conf_losses: confLosses,
                        wins: overallWins,
                        losses: overallLosses,
                        win_percent: winPercent,
                        streak: streak
                    });
                }
            }
        });

        if (standings.length === 0) {
            throw new Error('No standings data found in the table');
        }

        return standings;
    } catch (error) {
        console.error('Error fetching standings:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
        throw error;
    }
}

async function main() {
    try {
        console.log('\n=== Current Big 12 Women\'s Tennis Standings ===\n');
        
        const standings = await fetchStandings();
        
        // Sort by conference wins (descending) and win percentage (descending)
        standings.sort((a, b) => {
            if (a.conf_wins !== b.conf_wins) {
                return b.conf_wins - a.conf_wins;
            }
            return b.win_percent - a.win_percent;
        });

        // Display standings
        standings.forEach((team, index) => {
            console.log(`${index + 1}. ${team.team}`);
            console.log(`   Conference: ${team.conf_wins}-${team.conf_losses}`);
            console.log(`   Overall: ${team.wins}-${team.losses} (${(team.win_percent * 100).toFixed(1)}%)`);
            console.log(`   Streak: ${team.streak}`);
            console.log('');
        });

    } catch (error) {
        console.error('Failed to fetch standings:', error.message);
    }
}

main(); 