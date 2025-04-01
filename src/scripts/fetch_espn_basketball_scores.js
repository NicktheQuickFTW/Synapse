const knex = require('../config/database');
const moment = require('moment');
const cheerio = require('cheerio');
require('dotenv').config();

// Mapping of Big 12 teams to track their stats
const BIG12_TEAMS = {
    'Arizona': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] },
    'Arizona State': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] },
    'Baylor': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] },
    'Brigham Young': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] },
    'Cincinnati': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] },
    'Colorado': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] },
    'Houston': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] },
    'Iowa State': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] },
    'Kansas': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] },
    'Kansas State': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] },
    'Oklahoma State': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] },
    'TCU': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] },
    'Texas Tech': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] },
    'UCF': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] },
    'Utah': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] },
    'West Virginia': { wins: 0, losses: 0, confWins: 0, confLosses: 0, pointsFor: 0, pointsAgainst: 0, lastResults: [] }
};

async function fetchConferenceData() {
    try {
        const url = 'https://www.sports-reference.com/cbb/conferences/big-12/men/2025-schedule.html';
        console.log('Fetching Big 12 conference schedule...');
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch conference data: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Process each game in the schedule
        $('table tbody tr').each((_, row) => {
            const $row = $(row);
            const visitor = $row.find('td:nth-child(2) a').text().trim();
            const home = $row.find('td:nth-child(4) a').text().trim();
            const visitorPoints = parseInt($row.find('td:nth-child(3)').text().trim()) || 0;
            const homePoints = parseInt($row.find('td:nth-child(5)').text().trim()) || 0;
            
            if (visitor && home && (visitorPoints > 0 || homePoints > 0)) {
                // Update visitor stats
                if (BIG12_TEAMS[visitor]) {
                    BIG12_TEAMS[visitor].confWins += visitorPoints > homePoints ? 1 : 0;
                    BIG12_TEAMS[visitor].confLosses += visitorPoints < homePoints ? 1 : 0;
                    BIG12_TEAMS[visitor].pointsFor += visitorPoints;
                    BIG12_TEAMS[visitor].pointsAgainst += homePoints;
                    BIG12_TEAMS[visitor].lastResults.push(visitorPoints > homePoints ? 'W' : 'L');
                }
                
                // Update home stats
                if (BIG12_TEAMS[home]) {
                    BIG12_TEAMS[home].confWins += homePoints > visitorPoints ? 1 : 0;
                    BIG12_TEAMS[home].confLosses += homePoints < visitorPoints ? 1 : 0;
                    BIG12_TEAMS[home].pointsFor += homePoints;
                    BIG12_TEAMS[home].pointsAgainst += visitorPoints;
                    BIG12_TEAMS[home].lastResults.push(homePoints > visitorPoints ? 'W' : 'L');
                }
            }
        });

        // Calculate streaks and prepare data for database
        const teamStats = Object.entries(BIG12_TEAMS).map(([teamName, stats]) => {
            // Calculate streak
            let streak = 0;
            for (let i = stats.lastResults.length - 1; i >= 0; i--) {
                const result = stats.lastResults[i];
                if (i === stats.lastResults.length - 1) {
                    streak = result === 'W' ? 1 : -1;
                } else if (result === stats.lastResults[i + 1]) {
                    streak = result === 'W' ? streak + 1 : streak - 1;
                } else {
                    break;
                }
            }

            return {
                team: teamName,
                name: teamName,
                location: '',
                stats: {
                    wins: stats.confWins, // Using conf wins as total wins for now
                    losses: stats.confLosses,
                    confWins: stats.confWins,
                    confLosses: stats.confLosses,
                    winPercent: stats.confWins / (stats.confWins + stats.confLosses) || 0,
                    pointsFor: stats.pointsFor,
                    pointsAgainst: stats.pointsAgainst,
                    pointDifferential: stats.pointsFor - stats.pointsAgainst,
                    streak,
                    rank: null, // We'll need to get this from elsewhere
                    confRank: null
                }
            };
        });

        return teamStats;
    } catch (error) {
        console.error('Error fetching conference data:', error);
        return null;
    }
}

async function main() {
    try {
        console.log('\n=== Starting Big 12 Conference Data Fetcher ===\n');
        
        const teamStats = await fetchConferenceData();
        if (!teamStats) {
            throw new Error('Failed to fetch conference data');
        }

        // Sort teams by conference win percentage
        teamStats.sort((a, b) => {
            const aWinPct = a.stats.confWins / (a.stats.confWins + a.stats.confLosses) || 0;
            const bWinPct = b.stats.confWins / (b.stats.confWins + b.stats.confLosses) || 0;
            return bWinPct - aWinPct;
        });

        // Assign conference ranks
        teamStats.forEach((team, index) => {
            team.stats.confRank = index + 1;
        });

        // Log summary of what we found
        console.log('\nBig 12 Conference Standings:');
        teamStats.forEach(team => {
            const { stats } = team;
            console.log(`\n${team.name}:`);
            console.log(`Conference: ${stats.confWins}-${stats.confLosses} (${(stats.winPercent * 100).toFixed(1)}%)`);
            console.log(`Points: ${(stats.pointsFor / (stats.confWins + stats.confLosses)).toFixed(1)} for, ${(stats.pointsAgainst / (stats.confWins + stats.confLosses)).toFixed(1)} against per game`);
            console.log(`Total: ${stats.pointsFor} for, ${stats.pointsAgainst} against (${stats.pointDifferential} differential)`);
            if (stats.streak) console.log(`Streak: ${stats.streak > 0 ? 'W' + stats.streak : 'L' + Math.abs(stats.streak)}`);
            console.log(`Conference Rank: ${stats.confRank}`);
        });

        // Save to database
        try {
            // Delete existing team stats
            await knex('team_stats')
                .where({ sport: 'basketball' })
                .del();

            // Insert new team stats
            const statsToInsert = teamStats.map(team => ({
                sport: 'basketball',
                team: team.team,
                name: team.name,
                location: team.location,
                wins: team.stats.wins,
                losses: team.stats.losses,
                conf_wins: team.stats.confWins,
                conf_losses: team.stats.confLosses,
                win_percent: team.stats.winPercent,
                points_for: team.stats.pointsFor,
                points_against: team.stats.pointsAgainst,
                point_differential: team.stats.pointDifferential,
                streak: team.stats.streak,
                rank: team.stats.rank,
                conf_rank: team.stats.confRank,
                updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
            }));

            await knex('team_stats').insert(statsToInsert);
            console.log(`\n✅ Successfully saved team statistics to database`);
        } catch (error) {
            console.error('Error saving team statistics to database:', error);
        }

    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        await knex.destroy();
    }
}

main(); 