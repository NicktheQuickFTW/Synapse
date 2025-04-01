const axios = require('axios');
const { JSDOM } = require('jsdom');
const Parser = require('rss-parser');
const knex = require('../config/database');
const { fetchLocalRssFeed } = require('../utils/rss_fetcher');

const parser = new Parser();

// Sport-specific match patterns
const SPORT_PATTERNS = {
    'womens-tennis': /([A-Za-z\s]+)\s+vs\.?\s+([A-Za-z\s]+)\s+(\d+-\d+)/i,
    'mens-tennis': /([A-Za-z\s]+)\s+vs\.?\s+([A-Za-z\s]+)\s+(\d+-\d+)/i,
    'womens-basketball': /([A-Za-z\s]+)\s+vs\.?\s+([A-Za-z\s]+)\s+(\d+-\d+)/i,
    'mens-basketball': /([A-Za-z\s]+)\s+vs\.?\s+([A-Za-z\s]+)\s+(\d+-\d+)/i
};

// Sport detection patterns
const SPORT_DETECTION = {
    'womens-tennis': /women'?s?\s+tennis/i,
    'mens-tennis': /men'?s?\s+tennis/i,
    'womens-basketball': /women'?s?\s+basketball/i,
    'mens-basketball': /men'?s?\s+basketball/i
};

async function detectSport(title, description) {
    for (const [sport, pattern] of Object.entries(SPORT_DETECTION)) {
        if (pattern.test(title) || pattern.test(description)) {
            return sport;
        }
    }
    return null;
}

async function fetchHTMLSchedule(url, sport) {
    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const html = response.data;
        const dom = new JSDOM(html);
        const document = dom.window.document;
        
        const matches = [];
        
        // Find the schedule table
        const scheduleTable = document.querySelector('.sidearm-schedule-games-container, .schedule-table, .schedule');
        if (!scheduleTable) {
            console.error(`No schedule table found for ${url}`);
            return matches;
        }
        
        // Process each row
        const rows = scheduleTable.querySelectorAll('.sidearm-schedule-game, tr');
        rows.forEach(row => {
            try {
                const dateCell = row.querySelector('.sidearm-schedule-game-opponent-date, td:first-child');
                const opponentCell = row.querySelector('.sidearm-schedule-game-opponent-name, td:nth-child(2)');
                const locationCell = row.querySelector('.sidearm-schedule-game-location, td:nth-child(4)');
                const resultCell = row.querySelector('.sidearm-schedule-game-result, td:nth-child(3)');
                
                if (!dateCell || !opponentCell) return;
                
                const date = dateCell.textContent.trim();
                const opponent = opponentCell.textContent.trim();
                const location = locationCell ? locationCell.textContent.trim() : '';
                
                let result = null;
                let score = null;
                
                if (resultCell) {
                    const resultText = resultCell.textContent.trim();
                    const resultMatch = resultText.match(/(W|L|T)(?:,?\s*(\d+-\d+))?/i);
                    if (resultMatch) {
                        result = resultMatch[1].toUpperCase();
                        score = resultMatch[2];
                    }
                }
                
                // Skip rows without valid date or opponent
                if (!date || !opponent || date.toLowerCase().includes('date') || opponent.toLowerCase().includes('opponent')) {
                    return;
                }
                
                // Standardize date format
                const dateMatch = date.match(/(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?/);
                if (dateMatch) {
                    const [, month, day] = dateMatch;
                    const standardizedDate = `${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
                    
                    matches.push({
                        date: standardizedDate,
                        opponent,
                        location,
                        score,
                        result,
                        sport
                    });
                }
            } catch (error) {
                console.error(`Error processing row:`, error);
            }
        });
        
        return matches;
    } catch (error) {
        console.error(`Error fetching HTML schedule from ${url}:`, error);
        return [];
    }
}

async function fetchRSSFeed(feedUrl, sport) {
    try {
        let feed;
        
        // Check if the feed URL is a local file path
        if (feedUrl.startsWith('file://') || feedUrl.startsWith('/')) {
            feed = await fetchLocalRssFeed(feedUrl.replace('file://', ''));
        } else {
            feed = await parser.parseURL(feedUrl);
        }
        
        const matches = [];
        
        for (const item of feed.items) {
            const title = item.title;
            const description = item.description || '';
            const date = item.pubDate ? new Date(item.pubDate) : null;
            
            // For all-sports feed, detect the sport from the title/description
            const detectedSport = sport === 'all' ? 
                await detectSport(title, description) : 
                sport;
            
            if (!detectedSport) continue;
            
            const matchPattern = SPORT_PATTERNS[detectedSport] || /([A-Za-z\s]+)\s+vs\.?\s+([A-Za-z\s]+)\s+(\d+-\d+)/i;
            const match = title.match(matchPattern);
            
            if (match) {
                const [, team1, team2, score] = match;
                matches.push({
                    date,
                    opponent: team2.trim(),
                    location: 'Home', // Default to home since it's the school's feed
                    score,
                    result: score.split('-')[0] > score.split('-')[1] ? 'W' : 'L',
                    sport: detectedSport
                });
            }
        }
        
        return matches;
    } catch (error) {
        console.error('Error fetching RSS feed:', error);
        return [];
    }
}

async function fetchTeamSchedule(schoolName, sport) {
    try {
        // Get feed URL from database
        const feedRecord = await knex('school_rss_feeds')
            .where('school_name', schoolName)
            .where('sport', sport)
            .where('is_active', true)
            .first();

        if (!feedRecord) {
            console.log(`No feed found for ${schoolName} ${sport}`);
            return [];
        }

        if (feedRecord.feed_type === 'rss') {
            return await fetchRSSFeed(feedRecord.feed_url, sport);
        } else if (feedRecord.feed_type === 'html') {
            return await fetchHTMLSchedule(feedRecord.feed_url, sport);
        }

        console.log(`Unsupported feed type for ${schoolName} ${sport}: ${feedRecord.feed_type}`);
        return [];
    } catch (error) {
        console.error(`Error fetching schedule for ${schoolName} ${sport}:`, error);
        return [];
    }
}

async function saveMatchesToDatabase(matches, schoolName, sport) {
    try {
        await knex.transaction(async (trx) => {
            for (const match of matches) {
                // Insert or update match
                const [matchRecord] = await trx('matches')
                    .insert({
                        home_team: schoolName,
                        away_team: match.opponent,
                        match_date: match.date,
                        location: match.location,
                        winner: match.result === 'W' ? schoolName : match.opponent,
                        sport: sport
                    })
                    .onConflict(['home_team', 'away_team', 'match_date', 'sport'])
                    .merge()
                    .returning('*');

                // Update standings
                await trx('standings')
                    .insert({
                        team_name: schoolName,
                        sport: sport,
                        wins: match.result === 'W' ? 1 : 0,
                        losses: match.result === 'L' ? 1 : 0,
                        win_pct: match.result === 'W' ? 1 : 0
                    })
                    .onConflict(['team_name', 'sport'])
                    .merge({
                        wins: trx.raw('standings.wins + ?', [match.result === 'W' ? 1 : 0]),
                        losses: trx.raw('standings.losses + ?', [match.result === 'L' ? 1 : 0]),
                        win_pct: trx.raw('CAST(standings.wins + ? AS FLOAT) / NULLIF(standings.wins + standings.losses + 1, 0)', 
                            [match.result === 'W' ? 1 : 0])
                    });

                // Update head-to-head
                if (match.result) {
                    await trx('head_to_head')
                        .insert({
                            team1: schoolName,
                            team2: match.opponent,
                            sport: sport,
                            winner: match.result === 'W' ? schoolName : match.opponent
                        })
                        .onConflict(['team1', 'team2', 'sport'])
                        .merge();
                }
            }
        });
    } catch (error) {
        console.error(`Error saving matches to database for ${schoolName} ${sport}:`, error);
    }
}

async function fetchAllSchedules() {
    const allSchedules = {};
    const errors = [];
    
    // Get all active RSS feeds
    const feeds = await knex('school_rss_feeds')
        .where('is_active', true)
        .select('*');
    
    for (const feed of feeds) {
        try {
            console.log(`Fetching ${feed.sport} schedule for ${feed.school_name}...`);
            const matches = await fetchTeamSchedule(feed.school_name, feed.sport);
            if (matches.length === 0) {
                errors.push(`No matches found for ${feed.school_name} ${feed.sport}`);
            } else {
                await saveMatchesToDatabase(matches, feed.school_name, feed.sport);
                allSchedules[`${feed.school_name}-${feed.sport}`] = matches;
            }
        } catch (error) {
            console.error(`Failed to fetch schedule for ${feed.school_name} ${feed.sport}:`, error.message);
            errors.push(`Failed to fetch ${feed.school_name} ${feed.sport}: ${error.message}`);
            allSchedules[`${feed.school_name}-${feed.sport}`] = [];
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