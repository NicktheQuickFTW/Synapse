/**
 * Seed file to populate Big 12 teams
 */
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('teams').del()
    .then(function () {
      // Inserts seed entries
      return knex('teams').insert([
        // Legacy Big 12 Schools
        {
          name: 'Arizona State University',
          short_name: 'Arizona State',
          abbreviation: 'ASU',
          mascot: 'Sun Devils',
          primary_color: '#8C1D40',
          secondary_color: '#FFC627',
          location: 'Tempe, AZ',
          latitude: 33.4255,
          longitude: -111.9400,
          metadata: {
            founded: 1885,
            enrollment: 120000,
            nickname: 'Sun Devils',
            conference: 'Big 12',
            is_legacy: true
          }
        },
        {
          name: 'Baylor University',
          short_name: 'Baylor',
          abbreviation: 'BU',
          mascot: 'Bears',
          primary_color: '#003015',
          secondary_color: '#FFC72C',
          location: 'Waco, TX',
          latitude: 31.5469,
          longitude: -97.1211,
          metadata: {
            founded: 1845,
            enrollment: 20000,
            nickname: 'Bears',
            conference: 'Big 12',
            is_legacy: true
          }
        },
        {
          name: 'Brigham Young University',
          short_name: 'BYU',
          abbreviation: 'BYU',
          mascot: 'Cougars',
          primary_color: '#002E5D',
          secondary_color: '#FFFFFF',
          location: 'Provo, UT',
          latitude: 40.2518,
          longitude: -111.6493,
          metadata: {
            founded: 1875,
            enrollment: 33000,
            nickname: 'Cougars',
            conference: 'Big 12',
            is_legacy: true
          }
        },
        {
          name: 'University of Cincinnati',
          short_name: 'Cincinnati',
          abbreviation: 'CIN',
          mascot: 'Bearcats',
          primary_color: '#E00122',
          secondary_color: '#000000',
          location: 'Cincinnati, OH',
          latitude: 39.1329,
          longitude: -84.5150,
          metadata: {
            founded: 1819,
            enrollment: 47000,
            nickname: 'Bearcats',
            conference: 'Big 12',
            is_legacy: true
          }
        },
        {
          name: 'University of Colorado',
          short_name: 'Colorado',
          abbreviation: 'CU',
          mascot: 'Buffaloes',
          primary_color: '#CFB87C',
          secondary_color: '#000000',
          location: 'Boulder, CO',
          latitude: 40.0076,
          longitude: -105.2659,
          metadata: {
            founded: 1876,
            enrollment: 35000,
            nickname: 'Buffaloes',
            conference: 'Big 12',
            is_legacy: true
          }
        },
        {
          name: 'University of Houston',
          short_name: 'Houston',
          abbreviation: 'HOU',
          mascot: 'Cougars',
          primary_color: '#C8102E',
          secondary_color: '#FFFFFF',
          location: 'Houston, TX',
          latitude: 29.7198,
          longitude: -95.3421,
          metadata: {
            founded: 1927,
            enrollment: 47000,
            nickname: 'Cougars',
            conference: 'Big 12',
            is_legacy: true
          }
        },
        {
          name: 'Iowa State University',
          short_name: 'Iowa State',
          abbreviation: 'ISU',
          mascot: 'Cyclones',
          primary_color: '#C8102E',
          secondary_color: '#F7B718',
          location: 'Ames, IA',
          latitude: 42.0268,
          longitude: -93.6463,
          metadata: {
            founded: 1858,
            enrollment: 33000,
            nickname: 'Cyclones',
            conference: 'Big 12',
            is_legacy: true
          }
        },
        {
          name: 'Kansas State University',
          short_name: 'Kansas State',
          abbreviation: 'KSU',
          mascot: 'Wildcats',
          primary_color: '#512888',
          secondary_color: '#FFFFFF',
          location: 'Manhattan, KS',
          latitude: 39.1911,
          longitude: -96.5847,
          metadata: {
            founded: 1863,
            enrollment: 22000,
            nickname: 'Wildcats',
            conference: 'Big 12',
            is_legacy: true
          }
        },
        {
          name: 'Oklahoma State University',
          short_name: 'Oklahoma State',
          abbreviation: 'OSU',
          mascot: 'Cowboys',
          primary_color: '#FF7300',
          secondary_color: '#000000',
          location: 'Stillwater, OK',
          latitude: 36.1256,
          longitude: -97.0584,
          metadata: {
            founded: 1890,
            enrollment: 25000,
            nickname: 'Cowboys',
            conference: 'Big 12',
            is_legacy: true
          }
        },
        {
          name: 'Texas Christian University',
          short_name: 'TCU',
          abbreviation: 'TCU',
          mascot: 'Horned Frogs',
          primary_color: '#4D1979',
          secondary_color: '#FFFFFF',
          location: 'Fort Worth, TX',
          latitude: 32.7097,
          longitude: -97.3605,
          metadata: {
            founded: 1873,
            enrollment: 12000,
            nickname: 'Horned Frogs',
            conference: 'Big 12',
            is_legacy: true
          }
        },
        {
          name: 'Texas Tech University',
          short_name: 'Texas Tech',
          abbreviation: 'TTU',
          mascot: 'Red Raiders',
          primary_color: '#CC0000',
          secondary_color: '#000000',
          location: 'Lubbock, TX',
          latitude: 33.5846,
          longitude: -101.8807,
          metadata: {
            founded: 1923,
            enrollment: 40000,
            nickname: 'Red Raiders',
            conference: 'Big 12',
            is_legacy: true
          }
        },
        {
          name: 'University of Central Florida',
          short_name: 'UCF',
          abbreviation: 'UCF',
          mascot: 'Knights',
          primary_color: '#000000',
          secondary_color: '#FFC904',
          location: 'Orlando, FL',
          latitude: 28.6024,
          longitude: -81.2001,
          metadata: {
            founded: 1963,
            enrollment: 70000,
            nickname: 'Knights',
            conference: 'Big 12',
            is_legacy: true
          }
        },
        {
          name: 'University of Utah',
          short_name: 'Utah',
          abbreviation: 'UTAH',
          mascot: 'Utes',
          primary_color: '#CC0000',
          secondary_color: '#FFFFFF',
          location: 'Salt Lake City, UT',
          latitude: 40.7608,
          longitude: -111.8910,
          metadata: {
            founded: 1850,
            enrollment: 34000,
            nickname: 'Utes',
            conference: 'Big 12',
            is_legacy: true
          }
        },
        {
          name: 'West Virginia University',
          short_name: 'West Virginia',
          abbreviation: 'WVU',
          mascot: 'Mountaineers',
          primary_color: '#EAAA00',
          secondary_color: '#000000',
          location: 'Morgantown, WV',
          latitude: 39.6347,
          longitude: -79.9539,
          metadata: {
            founded: 1867,
            enrollment: 29000,
            nickname: 'Mountaineers',
            conference: 'Big 12',
            is_legacy: true
          }
        },

        // Affiliate Members
        {
          name: 'Air Force Academy',
          short_name: 'Air Force',
          abbreviation: 'AFA',
          mascot: 'Falcons',
          primary_color: '#003875',
          secondary_color: '#FFFFFF',
          location: 'Colorado Springs, CO',
          latitude: 38.9970,
          longitude: -104.8614,
          metadata: {
            founded: 1954,
            enrollment: 4000,
            nickname: 'Falcons',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['WR']
          }
        },
        {
          name: 'California Baptist University',
          short_name: 'Cal Baptist',
          abbreviation: 'CBU',
          mascot: 'Lancers',
          primary_color: '#003B70',
          secondary_color: '#FFD100',
          location: 'Riverside, CA',
          latitude: 33.9534,
          longitude: -117.3962,
          metadata: {
            founded: 1950,
            enrollment: 11000,
            nickname: 'Lancers',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['WR']
          }
        },
        {
          name: 'University of Denver',
          short_name: 'Denver',
          abbreviation: 'DEN',
          mascot: 'Pioneers',
          primary_color: '#C8102E',
          secondary_color: '#000000',
          location: 'Denver, CO',
          latitude: 39.6782,
          longitude: -104.9619,
          metadata: {
            founded: 1864,
            enrollment: 12000,
            nickname: 'Pioneers',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['GYM']
          }
        },
        {
          name: 'Florida State University',
          short_name: 'Florida',
          abbreviation: 'FLA',
          mascot: 'Gators',
          primary_color: '#0021A5',
          secondary_color: '#FA4616',
          location: 'Gainesville, FL',
          latitude: 29.6516,
          longitude: -82.3248,
          metadata: {
            founded: 1853,
            enrollment: 52000,
            nickname: 'Gators',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['LAX']
          }
        },
        {
          name: 'Fresno State University',
          short_name: 'Fresno State',
          abbreviation: 'FRES',
          mascot: 'Bulldogs',
          primary_color: '#C41200',
          secondary_color: '#000000',
          location: 'Fresno, CA',
          latitude: 36.8185,
          longitude: -119.7491,
          metadata: {
            founded: 1911,
            enrollment: 25000,
            nickname: 'Bulldogs',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['EQ']
          }
        },
        {
          name: 'University of Missouri',
          short_name: 'Missouri',
          abbreviation: 'MIZ',
          mascot: 'Tigers',
          primary_color: '#F1B82D',
          secondary_color: '#000000',
          location: 'Columbia, MO',
          latitude: 38.9404,
          longitude: -92.3277,
          metadata: {
            founded: 1839,
            enrollment: 31000,
            nickname: 'Tigers',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['WR']
          }
        },
        {
          name: 'North Dakota State University',
          short_name: 'North Dakota State',
          abbreviation: 'NDSU',
          mascot: 'Bison',
          primary_color: '#009A44',
          secondary_color: '#FFFFFF',
          location: 'Fargo, ND',
          latitude: 46.8973,
          longitude: -96.8018,
          metadata: {
            founded: 1890,
            enrollment: 12000,
            nickname: 'Bison',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['WR']
          }
        },
        {
          name: 'Northern Colorado University',
          short_name: 'Northern Colorado',
          abbreviation: 'UNC',
          mascot: 'Bears',
          primary_color: '#006633',
          secondary_color: '#FFFFFF',
          location: 'Greeley, CO',
          latitude: 40.4062,
          longitude: -104.7092,
          metadata: {
            founded: 1889,
            enrollment: 12000,
            nickname: 'Bears',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['WR']
          }
        },
        {
          name: 'University of Northern Iowa',
          short_name: 'Northern Iowa',
          abbreviation: 'UNI',
          mascot: 'Panthers',
          primary_color: '#6F263D',
          secondary_color: '#FFFFFF',
          location: 'Cedar Falls, IA',
          latitude: 42.5340,
          longitude: -92.4473,
          metadata: {
            founded: 1876,
            enrollment: 9000,
            nickname: 'Panthers',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['WR']
          }
        },
        {
          name: 'Old Dominion University',
          short_name: 'Old Dominion',
          abbreviation: 'ODU',
          mascot: 'Monarchs',
          primary_color: '#00507D',
          secondary_color: '#FFFFFF',
          location: 'Norfolk, VA',
          latitude: 36.8868,
          longitude: -76.3065,
          metadata: {
            founded: 1930,
            enrollment: 24000,
            nickname: 'Monarchs',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['ROW']
          }
        },
        {
          name: 'San Diego State University',
          short_name: 'San Diego State',
          abbreviation: 'SDSU',
          mascot: 'Aztecs',
          primary_color: '#A6192E',
          secondary_color: '#000000',
          location: 'San Diego, CA',
          latitude: 32.7756,
          longitude: -117.0719,
          metadata: {
            founded: 1897,
            enrollment: 36000,
            nickname: 'Aztecs',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['LAX']
          }
        },
        {
          name: 'South Dakota State University',
          short_name: 'South Dakota State',
          abbreviation: 'SDSU',
          mascot: 'Jackrabbits',
          primary_color: '#003875',
          secondary_color: '#FFD100',
          location: 'Brookings, SD',
          latitude: 44.3122,
          longitude: -96.7984,
          metadata: {
            founded: 1881,
            enrollment: 12000,
            nickname: 'Jackrabbits',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['WR']
          }
        },
        {
          name: 'University of California, Davis',
          short_name: 'UC Davis',
          abbreviation: 'UCD',
          mascot: 'Aggies',
          primary_color: '#003262',
          secondary_color: '#DAAA00',
          location: 'Davis, CA',
          latitude: 38.5449,
          longitude: -121.7405,
          metadata: {
            founded: 1905,
            enrollment: 39000,
            nickname: 'Aggies',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['LAX']
          }
        },
        {
          name: 'University of Tulsa',
          short_name: 'Tulsa',
          abbreviation: 'TUL',
          mascot: 'Golden Hurricane',
          primary_color: '#002D72',
          secondary_color: '#FFC72C',
          location: 'Tulsa, OK',
          latitude: 36.1557,
          longitude: -95.9457,
          metadata: {
            founded: 1894,
            enrollment: 4000,
            nickname: 'Golden Hurricane',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['ROW']
          }
        },
        {
          name: 'Utah Valley University',
          short_name: 'Utah Valley',
          abbreviation: 'UVU',
          mascot: 'Wolverines',
          primary_color: '#003057',
          secondary_color: '#FFFFFF',
          location: 'Orem, UT',
          latitude: 40.2769,
          longitude: -111.7151,
          metadata: {
            founded: 1941,
            enrollment: 41000,
            nickname: 'Wolverines',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['WR']
          }
        },
        {
          name: 'University of Wyoming',
          short_name: 'Wyoming',
          abbreviation: 'WYO',
          mascot: 'Cowboys',
          primary_color: '#492A24',
          secondary_color: '#FFFFFF',
          location: 'Laramie, WY',
          latitude: 41.3123,
          longitude: -105.5911,
          metadata: {
            founded: 1886,
            enrollment: 12000,
            nickname: 'Cowboys',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['WR']
          }
        },
        {
          name: 'University of Oklahoma',
          short_name: 'Oklahoma',
          abbreviation: 'OU',
          mascot: 'Sooners',
          primary_color: '#841617',
          secondary_color: '#F5F5F5',
          location: 'Norman, OK',
          latitude: 35.2059,
          longitude: -97.4457,
          metadata: {
            founded: 1890,
            enrollment: 28000,
            nickname: 'Sooners',
            conference: 'Big 12',
            is_legacy: false,
            affiliate_sports: ['WR']
          }
        }
      ]);
    });
}; 