import { SportManual } from '../types';

export const FootballManual: SportManual = {
  sport: 'football',
  version: '2024.1',
  lastUpdated: '2024-04-06',
  venue: {
    field: {
      length: {
        minimum: 120,
        recommended: 120,
        unit: 'yards',
        description: 'Total field length including end zones'
      },
      width: {
        minimum: 53.3,
        recommended: 53.3,
        unit: 'yards',
        description: 'Standard NCAA football field width'
      },
      surfaceTypes: [
        'natural grass',
        'artificial turf - NCAA approved'
      ],
      markings: [
        'yard lines',
        'hash marks',
        'sidelines',
        'end lines',
        'goal lines',
        'team areas'
      ]
    },
    lighting: {
      minimumLevel: {
        minimum: 100,
        recommended: 150,
        unit: 'footcandles',
        description: 'Minimum lighting level for evening games'
      },
      recommendedLevel: {
        minimum: 150,
        recommended: 200,
        unit: 'footcandles',
        description: 'Recommended lighting level for HD broadcasts'
      },
      eveningRequired: true
    },
    facilities: {
      required: [
        'locker rooms',
        'medical facilities',
        'officials room',
        'restrooms',
        'scoreboard',
        'play clocks',
        'press box'
      ],
      recommended: [
        'instant replay booth',
        'media room',
        'concessions',
        'video board'
      ]
    },
    safetyZones: [
      {
        minimumDistance: {
          minimum: 12,
          recommended: 15,
          unit: 'feet',
          description: 'Distance from sideline to any fixed object'
        },
        description: 'Team area and photographer zone clearance'
      }
    ]
  },
  weather: {
    temperature: {
      minimum: 32,
      maximum: 95,
      unit: 'fahrenheit',
      wetBulbThreshold: 82
    },
    wind: {
      maximumSpeed: 40,
      unit: 'mph'
    },
    precipitation: {
      maximumRate: 0.5,
      unit: 'inches/hour',
      fieldConditions: [
        'no standing water',
        'proper drainage',
        'field markings visible'
      ]
    },
    lightningProtocol: {
      delayDuration: 30,
      unit: 'minutes'
    }
  },
  scheduling: {
    gameDuration: {
      total: 210,
      regulation: 60,
      halftime: 20,
      warmup: 90,
      unit: 'minutes'
    },
    restPeriod: {
      minimum: 144,
      recommended: 168,
      unit: 'hours'
    },
    seasonLimits: {
      gamesPerWeek: 1,
      consecutiveAwayGames: 3
    },
    preferredStartTimes: [
      {
        time: '13:00',
        description: 'Traditional afternoon kickoff',
        priority: 1
      },
      {
        time: '15:30',
        description: 'Late afternoon kickoff',
        priority: 2
      },
      {
        time: '19:00',
        description: 'Evening kickoff',
        priority: 3
      }
    ],
    traditionalGameDays: [
      {
        day: 'Saturday',
        priority: 1,
        description: 'Primary game day'
      },
      {
        day: 'Thursday',
        priority: 2,
        description: 'Alternate weekday game'
      }
    ],
    restrictions: [
      'No games during final examination periods',
      'Minimum 5 days between conference games',
      'Maximum one Thursday game per team per season'
    ]
  },
  officials: {
    required: [
      {
        role: 'Referee',
        count: 1,
        description: 'Head official, final authority'
      },
      {
        role: 'Umpire',
        count: 1,
        description: 'Monitors line play and defensive formations'
      },
      {
        role: 'Head Linesman',
        count: 1,
        description: 'Monitors line of scrimmage and chain crew'
      },
      {
        role: 'Line Judge',
        count: 1,
        description: 'Monitors line of scrimmage and timing'
      },
      {
        role: 'Back Judge',
        count: 1,
        description: 'Deep coverage and timing'
      },
      {
        role: 'Field Judge',
        count: 1,
        description: 'Deep coverage and clock operator'
      },
      {
        role: 'Side Judge',
        count: 1,
        description: 'Deep coverage and game clock'
      }
    ],
    optional: [
      {
        role: 'Replay Official',
        count: 1,
        description: 'Reviews challenged plays'
      },
      {
        role: 'Clock Operator',
        count: 1,
        description: 'Manages game and play clocks'
      }
    ]
  },
  references: {
    rules: [
      'NCAA Football Rules and Interpretations 2024',
      'Big 12 Conference Football Regulations 2024'
    ],
    scheduling: [
      'Big 12 Conference Scheduling Guidelines 2024',
      'NCAA Football Championship Handbook 2024'
    ],
    facilities: [
      'NCAA Football Stadium Requirements 2024',
      'Big 12 Conference Facility Standards 2024'
    ],
    safety: [
      'NCAA Sports Medicine Handbook 2024',
      'NCAA Lightning Safety Guidelines',
      'Big 12 Conference Game Management Manual 2024'
    ]
  }
}; 