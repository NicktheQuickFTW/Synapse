const axios = require('axios');
const xml2js = require('xml2js');

const SPORTS = {
  'womens-tennis': ['womens-tennis', 'women-tennis', 'tennis-women', 'tennis-w', 'wtennis', 'tennis', 'Tennis, Women\'s', 'Women\'s Tennis'],
  'football': ['football', 'Football'],
  // Add more sports as needed
};

function normalizeTeamName(name) {
  return name
      .toLowerCase()
      .replace(/university|univ\.?/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s+/g, '-');
}

function generateMatchKey(homeTeam, awayTeam, date) {
  const teams = [normalizeTeamName(homeTeam), normalizeTeamName(awayTeam)].sort();
  return `${teams[0]}_${teams[1]}_${date}`;
}

function parseMatchTitle(title) {
  console.log('Parsing title:', title);
  
  // Extract date, time, and remainder
  const dateTimeMatch = title.match(/^(\d+\/\d+)(?:\s+(\d+:\d+\s*[AP]M))?\s+(.+)$/i);
  if (!dateTimeMatch) {
    console.log('Could not parse date/time from title');
    return null;
  }
  
  const [_, date, time, remainder] = dateTimeMatch;
  console.log('Date:', date);
  console.log('Time:', time || 'No time specified');
  console.log('Remainder:', remainder);

  // Extract sport and teams
  const sportMatch = remainder.match(/^((?:Women's|Men's)\s+[^\s]+)\s+(.+)$/i);
  if (!sportMatch) {
    console.log('Could not extract sport from remainder');
    return null;
  }

  const [__, sport, teams] = sportMatch;
  console.log('Sport:', sport);
  console.log('Teams:', teams);

  // Parse teams
  let homeTeam, awayTeam;
  if (teams.includes(' at ')) {
    [awayTeam, homeTeam] = teams.split(' at ').map(t => t.trim());
    console.log('Away team:', awayTeam);
    console.log('Home team:', homeTeam);
  } else if (teams.includes(' vs ')) {
    [homeTeam, awayTeam] = teams.split(' vs ').map(t => t.trim());
    console.log('Home team:', homeTeam);
    console.log('Away team:', awayTeam);
  } else {
    console.log('Could not parse teams');
    return null;
  }

  return {
    date,
    time: time || '',
    sport,
    homeTeam,
    awayTeam
  };
}

async function fetchBig12Calendar(sport = 'womens-tennis', teamName = null) {
  const url = 'https://big12sports.com/calendar.ashx/calendar.rss?sport=womens-tennis';
  console.log('Fetching calendar from:', url);

  return axios.get(url)
    .then(response => {
      return xml2js.parseStringPromise(response.data);
    })
    .then(result => {
      const items = result.rss.channel[0].item;
      const matches = new Map();

      items.forEach(item => {
        const title = item.title[0];
        const description = item.description[0];
        console.log('Debug - Title:', title);
        console.log('Debug - Description:', description);

        const matchInfo = parseMatchTitle(title);
        if (!matchInfo) {
          return;
        }

        const { sport, homeTeam, awayTeam } = matchInfo;
        if (sport.toLowerCase().includes('women') && 
            sport.toLowerCase().includes('tennis') &&
            (normalizeTeamName(homeTeam).includes(normalizeTeamName(teamName)) || 
             normalizeTeamName(awayTeam).includes(normalizeTeamName(teamName)))) {
          
          const key = generateMatchKey(matchInfo.homeTeam, matchInfo.awayTeam, matchInfo.date);
          if (!matches.has(key)) {
            matches.set(key, {
              ...matchInfo,
              link: item.link ? item.link[0] : ''
            });
          }
        }
      });

      const sortedMatches = Array.from(matches.values())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      console.log(`\nFound ${sortedMatches.length} unique women's tennis matches for ${teamName}:`);
      sortedMatches.forEach(match => {
        console.log(`\n${match.date} ${match.time}`);
        console.log(`${match.homeTeam} vs ${match.awayTeam}`);
        if (match.link) {
          console.log(`More info: ${match.link}`);
        }
      });

      return sortedMatches;
    })
    .catch(error => {
      console.error('Error fetching calendar:', error);
      return [];
    });
}

// Example usage
const sport = process.argv[2] || 'womens-tennis';
const teamName = process.argv[3] || null;
fetchBig12Calendar(sport, teamName)
  .catch(error => {
    console.error('Failed to fetch calendar:', error);
    process.exit(1);
  }); 