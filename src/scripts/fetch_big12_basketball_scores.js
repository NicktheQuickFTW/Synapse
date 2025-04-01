const knex = require('../config/database');
const moment = require('moment');
const cheerio = require('cheerio');
const BIG12_TEAMS = require('../config/big12_basketball');
require('dotenv').config();

async function fetchTeamSchedule(teamName, scheduleId) {
    try {
        const url = `https://big12sports.com/schedule.aspx?schedule=${scheduleId}`;
        console.log(`Fetching schedule for ${teamName}...`);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch schedule for ${teamName}: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Process schedule table
        const games = [];
        let wins = 0;
        let losses = 0;
        let confWins = 0;
        let confLosses = 0;
        let streak = 0;
        let lastResult = '';
        let totalPoints = 0;
        let totalOppPoints = 0;
        let gamesPlayed = 0;

        // Find the schedule table
        $('table tr').each((_, row) => {
            const $row = $(row);
            const date = $row.find('td:first-child').text().trim();
            const opponent = $row.find('td:nth-child(2)').text().trim();
            const isConference = $row.find('td:nth-child(3)').text().trim() === '*';
            const location = $row.find('td:nth-child(4)').text().trim();
            const result = $row.find('td:last-child').text().trim();

            if (date && opponent && result && result !== 'Postponed' && result !== 'Cancelled') {
                // Skip future games that only have times
                if (result.includes(':') && !result.includes('W') && !result.includes('L')) {
                    return;
                }

                // Parse result (e.g., "W 85-72" or "L 68-75")
                const resultParts = result.split(' ');
                const isWin = resultParts[0] === 'W';
                let points = 0;
                let oppPoints = 0;

                if (resultParts.length > 1) {
                    const scoreParts = resultParts[1].split('-');
                    points = parseInt(scoreParts[0]) || 0;
                    oppPoints = parseInt(scoreParts[1]) || 0;
                }

                if (points > 0 || oppPoints > 0) {
                    // Clean up opponent name
                    let cleanOpponent = opponent.replace(/^vs\.\s*/, '').replace(/^at\s*/, '').trim();
                    
                    // Clean up location
                    let cleanLocation = location.replace(/^at\s*/, '').trim();

                    // If location is empty but opponent starts with "vs.", use the opponent's location
                    if (!cleanLocation && opponent.startsWith('vs.')) {
                        cleanLocation = cleanOpponent;
                    }

                    // If both opponent and location start with "at", use the opponent's location
                    if (opponent.startsWith('at') && location.startsWith('at')) {
                        cleanLocation = cleanOpponent;
                    }

                    // If opponent has "vs." or "at" but location is different, use the location
                    if ((opponent.startsWith('vs.') || opponent.startsWith('at')) && cleanLocation) {
                        cleanOpponent = opponent.replace(/^(vs\.|at)\s*/, '').trim();
                    }

                    games.push({
                        date,
                        opponent: cleanOpponent,
                        isConference,
                        location: cleanLocation,
                        result: resultParts[0],
                        points,
                        oppPoints
                    });

                    // Update statistics
                    if (isWin) {
                        wins++;
                        if (isConference) confWins++;
                        if (lastResult !== 'W') streak = 1;
                        else streak++;
                        lastResult = 'W';
                    } else if (resultParts[0] === 'L') {
                        losses++;
                        if (isConference) confLosses++;
                        if (lastResult !== 'L') streak = -1;
                        else streak--;
                        lastResult = 'L';
                    }

                    if (points > 0 || oppPoints > 0) {
                        totalPoints += points;
                        totalOppPoints += oppPoints;
                        gamesPlayed++;
                    }
                }
            }
        });

        const pointsPerGame = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;
        const pointsAllowedPerGame = gamesPlayed > 0 ? totalOppPoints / gamesPlayed : 0;

        return {
            team: teamName,
            name: teamName,
            location: '',
            stats: {
                wins,
                losses,
                confWins,
                confLosses,
                winPercent: (wins + losses) > 0 ? wins / (wins + losses) : 0,
                pointsPerGame,
                pointsAllowedPerGame,
                pointDifferential: pointsPerGame - pointsAllowedPerGame,
                streak,
                rank: null,
                confRank: null,
                schedule: games
            }
        };
    } catch (error) {
        console.error(`Error fetching schedule for ${teamName}:`, error);
        return null;
    }
}

async function main() {
    try {
        console.log('\n=== Starting Big 12 Men\'s Basketball Schedule Fetcher ===\n');
        console.log(`Found ${Object.keys(BIG12_TEAMS).length} teams`);
        
        const allTeamStats = [];
        
        // Fetch schedule for each team
        for (const [teamName, scheduleId] of Object.entries(BIG12_TEAMS)) {
            const teamStats = await fetchTeamSchedule(teamName, scheduleId);
            if (teamStats) {
                allTeamStats.push(teamStats);
            }
            // Add a delay between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Sort teams by conference win percentage
        allTeamStats.sort((a, b) => {
            const aWinPct = a.stats.confWins / (a.stats.confWins + a.stats.confLosses) || 0;
            const bWinPct = b.stats.confWins / (b.stats.confWins + b.stats.confLosses) || 0;
            return bWinPct - aWinPct;
        });

        // Assign conference ranks
        allTeamStats.forEach((team, index) => {
            team.stats.confRank = index + 1;
        });

        // Log summary of what we found
        console.log('\nBig 12 Team Statistics:');
        allTeamStats.forEach(team => {
            const { stats } = team;
            console.log(`\n${team.name}:`);
            console.log(`Overall: ${stats.wins}-${stats.losses} (${(stats.winPercent * 100).toFixed(1)}%)`);
            console.log(`Conference: ${stats.confWins}-${stats.confLosses}`);
            console.log(`Points: ${stats.pointsPerGame.toFixed(1)} for, ${stats.pointsAllowedPerGame.toFixed(1)} against per game (${stats.pointDifferential.toFixed(1)} differential)`);
            if (stats.streak) console.log(`Streak: ${stats.streak > 0 ? 'W' + stats.streak : 'L' + Math.abs(stats.streak)}`);
            console.log(`Conference Rank: ${stats.confRank}`);
            
            console.log('\nSchedule:');
            stats.schedule.forEach(game => {
                console.log(`${game.date}: ${game.location} - ${game.opponent}${game.isConference ? ' *' : ''} - ${game.result} ${game.points}-${game.oppPoints}`);
            });
        });

        // Save to database
        try {
            // Create team_stats table if it doesn't exist
            await knex.schema.createTableIfNotExists('team_stats', table => {
                table.increments('id').primary();
                table.string('sport').notNullable();
                table.string('team').notNullable();
                table.string('name').notNullable();
                table.string('location');
                table.integer('wins').defaultTo(0);
                table.integer('losses').defaultTo(0);
                table.integer('conf_wins').defaultTo(0);
                table.integer('conf_losses').defaultTo(0);
                table.float('win_percent').defaultTo(0);
                table.float('points_for').defaultTo(0);
                table.float('points_against').defaultTo(0);
                table.float('point_differential').defaultTo(0);
                table.integer('streak').defaultTo(0);
                table.integer('rank');
                table.integer('conf_rank');
                table.json('schedule');
                table.timestamp('updated_at').defaultTo(knex.fn.now());
            });

            // Delete existing team stats
            await knex('team_stats')
                .where({ sport: 'mens-basketball' })
                .del();

            // Insert new team stats
            const statsToInsert = allTeamStats.map(team => ({
                sport: 'mens-basketball',
                team: team.team,
                name: team.name,
                location: team.location,
                wins: team.stats.wins,
                losses: team.stats.losses,
                conf_wins: team.stats.confWins,
                conf_losses: team.stats.confLosses,
                win_percent: team.stats.winPercent,
                points_for: team.stats.pointsPerGame,
                points_against: team.stats.pointsAllowedPerGame,
                point_differential: team.stats.pointDifferential,
                streak: team.stats.streak,
                rank: team.stats.rank,
                conf_rank: team.stats.confRank,
                schedule: JSON.stringify(team.stats.schedule),
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