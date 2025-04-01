const axios = require('axios');
const cheerio = require('cheerio');
const knex = require('../db/knex');
const scheduleIds = require('../config/big12_womens_tennis');
require('dotenv').config();

async function fetchTeamSchedule(team, scheduleId) {
    try {
        const response = await axios.get(`https://big12sports.com/schedule.aspx?schedule=${scheduleId}`);
        const $ = cheerio.load(response.data);
        const games = [];

        // Find the schedule table - it's usually the one with class "sidearm-table"
        $('table.sidearm-table tr:not(.header)').each((i, row) => {
            const columns = $(row).find('td');
            if (columns.length >= 4) {
                const date = $(columns[0]).text().trim();
                const opponent = $(columns[1]).text().trim();
                const location = $(columns[2]).text().trim();
                const result = $(columns[3]).text().trim();

                if (date && (opponent || location)) {
                    // Clean up the data and create a plain object
                    const cleanOpponent = opponent.replace(/^at\s+/, '').replace(/^\*\s*/, '').trim();
                    const cleanLocation = location.replace(/^at\s+/, '').trim();
                    const isConference = opponent.includes('*');

                    // Parse the result
                    let parsedResult = result;
                    if (result.includes('W')) {
                        parsedResult = 'W';
                    } else if (result.includes('L')) {
                        parsedResult = 'L';
                    }

                    games.push({
                        date: date,
                        location: cleanLocation || 'Home',
                        opponent: isConference ? cleanOpponent + ' *' : cleanOpponent,
                        result: parsedResult
                    });
                }
            }
        });

        return games;
    } catch (error) {
        throw new Error(`Failed to fetch schedule for ${team}: ${error.message}`);
    }
}

async function processSchedule(schedule) {
    let wins = 0, losses = 0;
    let confWins = 0, confLosses = 0;
    let pointsFor = 0, pointsAgainst = 0;
    let streak = 0;
    let currentStreak = 0;

    schedule.forEach(game => {
        if (game.result === 'W') {
            wins++;
            if (game.opponent.includes('*')) confWins++;
            currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
        } else if (game.result === 'L') {
            losses++;
            if (game.opponent.includes('*')) confLosses++;
            currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
        }

        // Only count points for completed games
        if (game.result === 'W' || game.result === 'L') {
            const score = game.result.match(/\d+-\d+/);
            if (score) {
                const [teamScore, oppScore] = score[0].split('-').map(Number);
                pointsFor += teamScore;
                pointsAgainst += oppScore;
            }
        }

        streak = currentStreak;
    });

    return {
        wins,
        losses,
        conf_wins: confWins,
        conf_losses: confLosses,
        win_percent: (wins + losses) > 0 ? wins / (wins + losses) : 0,
        points_for: (wins + losses) > 0 ? pointsFor / (wins + losses) : 0,
        points_against: (wins + losses) > 0 ? pointsAgainst / (wins + losses) : 0,
        point_differential: (wins + losses) > 0 ? (pointsFor - pointsAgainst) / (wins + losses) : 0,
        streak
    };
}

async function main() {
    try {
        console.log('\n=== Starting Big 12 Women\'s Tennis Schedule Fetcher ===\n');
        
        // Delete existing entries for this sport
        await knex('team_stats')
            .where('sport', 'womens-tennis')
            .del();

        const teams = Object.keys(scheduleIds);
        console.log(`Found ${teams.length} teams`);

        for (const team of teams) {
            console.log(`Fetching schedule for ${team}...`);
            try {
                const schedule = await fetchTeamSchedule(team, scheduleIds[team]);
                const stats = await processSchedule(schedule);

                // Save to database with stringified schedule
                await knex('team_stats').insert({
                    sport: 'womens-tennis',
                    team: team,
                    name: team,
                    location: '',
                    wins: stats.wins,
                    losses: stats.losses,
                    conf_wins: stats.conf_wins,
                    conf_losses: stats.conf_losses,
                    win_percent: stats.win_percent,
                    points_for: stats.points_for,
                    points_against: stats.points_against,
                    point_differential: stats.point_differential,
                    streak: stats.streak,
                    schedule: JSON.stringify(schedule),
                    updated_at: new Date()
                });

            } catch (error) {
                console.error(error.message);
            }
        }

        // Query and display the results
        const teams_stats = await knex('team_stats')
            .where('sport', 'womens-tennis')
            .orderBy(['conf_wins', 'win_percent'], 'desc');

        console.log('\nBig 12 Team Statistics:\n');
        teams_stats.forEach((team, index) => {
            console.log(`${team.team}:`);
            console.log(`Overall: ${team.wins}-${team.losses} (${(team.win_percent * 100).toFixed(1)}%)`);
            console.log(`Conference: ${team.conf_wins}-${team.conf_losses}`);
            console.log(`Points: ${team.points_for.toFixed(1)} for, ${team.points_against.toFixed(1)} against per game (${team.point_differential.toFixed(1)} differential)`);
            console.log(`Streak: ${team.streak}`);
            console.log(`Conference Rank: ${index + 1}`);
            console.log('\nSchedule:');
            
            const schedule = team.schedule;
            if (Array.isArray(schedule)) {
                schedule.forEach(game => {
                    console.log(`${game.date}: ${game.location} - ${game.opponent} - ${game.result}`);
                });
            } else {
                console.log('No schedule data available');
            }
            console.log('\n');
        });

        console.log('✅ Successfully saved team statistics to database');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await knex.destroy();
    }
}

main(); 