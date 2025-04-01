const axios = require('axios');
const { JSDOM } = require('jsdom');

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
    { name: 'Texas Tech', url: 'https://texastech.com/sports/womens-tennis/schedule' },
    { name: 'UCF', url: 'https://ucfknights.com/sports/womens-tennis/schedule' },
    { name: 'Utah', url: 'https://utahutes.com/sports/womens-tennis/schedule' },
    { name: 'West Virginia', url: 'https://wvusports.com/sports/womens-tennis/schedule' }
];

async function fetchTeamSchedule(team) {
    try {
        const response = await axios.get(team.url, {
            timeout: 10000, // 10 second timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = response.data;
        const dom = new JSDOM(html);
        const document = dom.window.document;

        // Find the schedule table or list
        const scheduleElement = document.querySelector('.sidearm-schedule-games-container, .schedule-table, .schedule');
        if (!scheduleElement) {
            console.error(`No schedule found for ${team.name} - DOM structure may have changed`);
            return [];
        }

        const matches = [];
        const rows = scheduleElement.querySelectorAll('.sidearm-schedule-game, tr');

        rows.forEach(row => {
            try {
                let date, opponent, location, result, score, isConference;

                if (team.name === 'Texas Tech') {
                    // Special handling for Texas Tech's format
                    const dateCell = row.querySelector('td:first-child');
                    const opponentCell = row.querySelector('td:nth-child(2)');
                    const resultCell = row.querySelector('td:nth-child(3)');
                    const locationCell = row.querySelector('td:nth-child(4)');

                    if (dateCell && opponentCell) {
                        date = dateCell.textContent.trim();
                        opponent = opponentCell.textContent.trim();
                        location = locationCell ? locationCell.textContent.trim() : '';
                        
                        if (resultCell) {
                            const resultText = resultCell.textContent.trim();
                            const resultMatch = resultText.match(/(W|L|T)(?:,?\s*(\d+-\d+))?/i);
                            if (resultMatch) {
                                result = resultMatch[1].toUpperCase();
                                score = resultMatch[2];
                            }
                        }
                        
                        // Check if it's a conference match
                        isConference = opponent.includes('[Big 12]') || 
                                     opponent.includes('*') || 
                                     TEAMS.some(t => opponent.includes(t.name));
                    }
                } else {
                    // Default handling for other teams
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
                }

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

        return matches;
    } catch (error) {
        console.error(`Error fetching schedule for ${team.name}:`, error);
        return [];
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
            }
            allSchedules[team.name] = matches;
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
        console.log(`Away: ${stats.location.away} wins`);
        console.log(`Neutral: ${stats.location.neutral} wins`);
        
        console.log('\nMatches:');
        matches.forEach(match => {
            const result = match.result ? ` (${match.result}${match.score ? `, ${match.score}` : ''})` : '';
            const conference = match.isConference ? ' [Big 12]' : '';
            console.log(`${match.date}: ${match.opponent}${result}${conference}`);
            if (match.location) console.log(`Location: ${match.location}`);
            console.log('---');
        });
    }
}

main().catch(console.error); 