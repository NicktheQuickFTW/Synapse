const axios = require('axios');
const { JSDOM } = require('jsdom');
const Parser = require('rss-parser');
const knex = require('../config/database');

const parser = new Parser();

// List of all Big 12 women's tennis teams and their schedule URLs
const TEAMS = [
    { name: 'Arizona', url: 'https://arizonawildcats.com/sports/womens-tennis/schedule' },
    { name: 'Arizona State', url: 'https://thesundevils.com/sports/womens-tennis/schedule' },
    { name: 'Baylor', url: 'https://baylorbears.com/sports/womens-tennis/schedule' },
    { name: 'BYU', url: 'https://byucougars.com/sports/womens-tennis/schedule' },
    { name: 'Cincinnati', url: 'https://gobearcats.com/sports/womens-tennis/schedule' },
    { name: 'Colorado', url: 'https://cubuffs.com/sports/womens-tennis/schedule' },
    { name: 'Houston', url: 'https://uhcougars.com/sports/womens-tennis/schedule' },
    { name: 'Iowa State', url: 'https://cyclones.com/sports/womens-tennis/schedule' },
    { name: 'Kansas', url: 'https://kuathletics.com/sports/womens-tennis/schedule' },
    { name: 'Kansas State', url: 'https://www.kstatesports.com/sports/womens-tennis/schedule' },
    { name: 'Oklahoma State', url: 'https://okstate.com/sports/womens-tennis/schedule' },
    { name: 'TCU', url: 'https://gofrogs.com/sports/womens-tennis/schedule' },
    { name: 'Texas Tech', url: 'https://texastech.com/calendar' },
    { name: 'UCF', url: 'https://ucfknights.com/sports/womens-tennis/schedule' },
    { name: 'Utah', url: 'https://utahutes.com/sports/womens-tennis/schedule' },
    { name: 'West Virginia', url: 'https://wvusports.com/sports/womens-tennis/schedule' }
];

async function fetchRSSFeed(feedUrl) {
    try {
        const feed = await parser.parseURL(feedUrl);
        return feed.items.map(item => {
            // Parse the title to extract match information
            const title = item.title;
            const date = item.pubDate ? new Date(item.pubDate) : null;
            
            // Extract teams and score from title
            const matchRegex = /([A-Za-z\s]+)\s+vs\.?\s+([A-Za-z\s]+)\s+(\d+-\d+)/i;
            const match = title.match(matchRegex);
            
            if (match) {
                const [, team1, team2, score] = match;
                return {
                    date,
                    opponent: team2.trim(),
                    location: 'Home', // Default to home since it's the school's feed
                    score,
                    result: score.split('-')[0] > score.split('-')[1] ? 'W' : 'L',
                    isConference: TEAMS.some(t => team2.includes(t.name))
                };
            }
            
            return null;
        }).filter(Boolean);
    } catch (error) {
        console.error('Error fetching RSS feed:', error);
        return [];
    }
}

async function fetchTeamSchedule(team) {
    try {
        // First try to get RSS feed URL from database
        const feedRecord = await knex('school_rss_feeds')
            .where('school_name', team.name)
            .where('is_active', true)
            .first();

        if (feedRecord && feedRecord.feed_type === 'rss') {
            return await fetchRSSFeed(feedRecord.feed_url);
        }

        // Fall back to HTML scraping
        const response = await axios.get(team.url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = response.data;
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const matches = [];

        if (team.name === 'Texas Tech') {
            // Handle Texas Tech's calendar format
            const calendarEvents = document.querySelectorAll('.calendar-event');
            calendarEvents.forEach(event => {
                try {
                    const sportElement = event.querySelector('.sport-name');
                    if (!sportElement || !sportElement.textContent.includes('Women\'s Tennis')) {
                        return;
                    }

                    const dateElement = event.querySelector('.event-date');
                    const opponentElement = event.querySelector('.event-title');
                    const locationElement = event.querySelector('.event-location');
                    const resultElement = event.querySelector('.event-result');

                    if (!dateElement || !opponentElement) {
                        return;
                    }

                    const date = dateElement.textContent.trim();
                    const opponent = opponentElement.textContent.trim();
                    const location = locationElement ? locationElement.textContent.trim() : '';
                    
                    let result = null;
                    let score = null;
                    
                    if (resultElement) {
                        const resultText = resultElement.textContent.trim();
                        const resultMatch = resultText.match(/(W|L|T)(?:,?\s*(\d+-\d+))?/i);
                        if (resultMatch) {
                            result = resultMatch[1].toUpperCase();
                            score = resultMatch[2];
                        }
                    }

                    // Check if it's a conference match
                    const isConference = opponent.includes('[Big 12]') || 
                                      opponent.includes('*') || 
                                      TEAMS.some(t => opponent.includes(t.name));

                    matches.push({
                        date,
                        opponent,
                        location,
                        score,
                        result,
                        isConference
                    });
                } catch (error) {
                    console.error(`Error processing calendar event for ${team.name}:`, error);
                }
            });
        } else {
            // Default handling for other teams
            const scheduleElement = document.querySelector('.sidearm-schedule-games-container, .schedule-table, .schedule');
            if (!scheduleElement) {
                console.error(`No schedule found for ${team.name} - DOM structure may have changed`);
                return [];
            }

            const rows = scheduleElement.querySelectorAll('.sidearm-schedule-game, tr');
            rows.forEach(row => {
                try {
                    let date, opponent, location, result, score, isConference;

                    const dateCell = row.querySelector('.sidearm-schedule-game-opponent-date, td:first-child');
                    const opponentCell = row.querySelector('.sidearm-schedule-game-opponent-name, td:nth-child(2)');
                    const locationCell = row.querySelector('.sidearm-schedule-game-location, td:nth-child(4)');
                    const resultCell = row.querySelector('.sidearm-schedule-game-result, td:nth-child(3)');

                    date = dateCell ? dateCell.textContent.trim() : '';
                    opponent = opponentCell ? opponentCell.textContent.trim() : '';
                    location = locationCell ? locationCell.textContent.trim() : '';

                    if (resultCell) {
                        const resultText = resultCell.textContent.trim();
                        const resultMatch = resultText.match(/(W|L|T)(?:,?\s*(\d+-\d+))?/i);
                        if (resultMatch) {
                            result = resultMatch[1].toUpperCase();
                            score = resultMatch[2];
                        }
                    }

                    isConference = row.querySelector('.sidearm-schedule-game-conference, .conference') !== null ||
                                 TEAMS.some(t => opponent.includes(t.name));

                    // Skip rows without valid date or opponent
                    if (!date || !opponent || date.toLowerCase().includes('date') || opponent.toLowerCase().includes('opponent')) {
                        return;
                    }

                    // Standardize date format
                    const dateMatch = date.match(/(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?/);
                    if (dateMatch) {
                        const [, month, day] = dateMatch;
                        date = `${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
                    }

                    matches.push({
                        date,
                        opponent,
                        location,
                        score,
                        result,
                        isConference
                    });
                } catch (error) {
                    console.error(`Error processing row for ${team.name}:`, error);
                }
            });
        }

        return matches;
    } catch (error) {
        console.error(`Error fetching schedule for ${team.name}:`, error);
        return [];
    }
}

async function saveMatchesToDatabase(matches, schoolName) {
    try {
        await knex.transaction(async (trx) => {
            for (const match of matches) {
                // Insert or update match
                const [matchRecord] = await trx('tennis_matches')
                    .insert({
                        home_team: schoolName,
                        away_team: match.opponent,
                        match_date: match.date,
                        location: match.location,
                        winner: match.result === 'W' ? schoolName : match.opponent
                    })
                    .onConflict(['home_team', 'away_team', 'match_date'])
                    .merge()
                    .returning('*');

                // Update standings
                await trx('tennis_standings')
                    .insert({
                        team_name: schoolName,
                        wins: match.result === 'W' ? 1 : 0,
                        losses: match.result === 'L' ? 1 : 0,
                        win_pct: match.result === 'W' ? 1 : 0
                    })
                    .onConflict('team_name')
                    .merge({
                        wins: trx.raw('tennis_standings.wins + ?', [match.result === 'W' ? 1 : 0]),
                        losses: trx.raw('tennis_standings.losses + ?', [match.result === 'L' ? 1 : 0]),
                        win_pct: trx.raw('CAST(tennis_standings.wins + ? AS FLOAT) / NULLIF(tennis_standings.wins + tennis_standings.losses + 1, 0)', 
                            [match.result === 'W' ? 1 : 0])
                    });

                // Update head-to-head
                if (match.result) {
                    await trx('tennis_head_to_head')
                        .insert({
                            team1: schoolName,
                            team2: match.opponent,
                            winner: match.result === 'W' ? schoolName : match.opponent
                        })
                        .onConflict(['team1', 'team2'])
                        .merge();
                }
            }
        });
    } catch (error) {
        console.error(`Error saving matches to database for ${schoolName}:`, error);
    }
}

async function fetchAllSchedules() {
    const allSchedules = {};
    const errors = [];
    
    for (const team of TEAMS) {
        try {
            console.log(`Fetching schedule for ${team.name}...`);
            const matches = await fetchTeamSchedule(team);
            if (matches.length === 0) {
                errors.push(`No matches found for ${team.name}`);
            } else {
                await saveMatchesToDatabase(matches, team.name);
                allSchedules[team.name] = matches;
            }
        } catch (error) {
            console.error(`Failed to fetch schedule for ${team.name}:`, error.message);
            errors.push(`Failed to fetch ${team.name}: ${error.message}`);
            allSchedules[team.name] = [];
        }
    }

    if (errors.length > 0) {
        console.error('\nErrors encountered:');
        errors.forEach(error => console.error('-', error));
    }

    return allSchedules;
}

function calculateTeamStats(matches) {
    let wins = 0;
    let losses = 0;
    let ties = 0;
    let conferenceWins = 0;
    let conferenceLosses = 0;
    let homeWins = 0;
    let awayWins = 0;
    let neutralWins = 0;

    matches.forEach(match => {
        if (match.result) {
            if (match.result === 'W') {
                wins++;
                if (match.isConference) conferenceWins++;
                
                // Determine location type
                const locationLower = (match.location || '').toLowerCase();
                if (locationLower.includes('home') || locationLower.includes('tennis center')) {
                    homeWins++;
                } else if (locationLower.includes('away') || locationLower.includes('at ')) {
                    awayWins++;
                } else {
                    neutralWins++;
                }
            } else if (match.result === 'L') {
                losses++;
                if (match.isConference) conferenceLosses++;
            } else if (match.result === 'T') {
                ties++;
            }
        }
    });

    const total = wins + losses + ties;
    const confTotal = conferenceWins + conferenceLosses;

    return {
        overall: {
            wins,
            losses,
            ties,
            percentage: total > 0 ? wins / total : 0
        },
        conference: {
            wins: conferenceWins,
            losses: conferenceLosses,
            percentage: confTotal > 0 ? conferenceWins / confTotal : 0
        },
        location: {
            home: homeWins,
            away: awayWins,
            neutral: neutralWins
        }
    };
}

async function main() {
    const schedules = await fetchAllSchedules();
    
    for (const [team, matches] of Object.entries(schedules)) {
        console.log(`\n${team} Women's Tennis Schedule:`);
        console.log('='.repeat(50));
        
        const stats = calculateTeamStats(matches);
        
        console.log('\nRecord:');
        console.log(`Overall: ${stats.overall.wins}-${stats.overall.losses}-${stats.overall.ties} (${(stats.overall.percentage * 100).toFixed(1)}%)`);
        console.log(`Conference: ${stats.conference.wins}-${stats.conference.losses} (${(stats.conference.percentage * 100).toFixed(1)}%)`);
        console.log(`Home: ${stats.location.home} wins`);
        console.log(`