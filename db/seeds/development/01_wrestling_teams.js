/**
 * Seed file for wrestling teams data
 */
exports.seed = async function(knex) {
  // Delete existing entries
  await knex('wrestling_teams').del();
  
  // Insert seed entries
  await knex('wrestling_teams').insert([
    {
      name: 'Arizona State', 
      short_name: 'ASU', 
      abbreviation: 'ASU',
      mascot: 'Sun Devils',
      primary_color: '#8C1D40', 
      secondary_color: '#FFC627',
      location: 'Tempe, AZ',
      latitude: 33.4255,
      longitude: -111.9400
    },
    {
      name: 'Iowa State', 
      short_name: 'Iowa St', 
      abbreviation: 'ISU',
      mascot: 'Cyclones',
      primary_color: '#C8102E', 
      secondary_color: '#F1BE48',
      location: 'Ames, IA',
      latitude: 42.0266,
      longitude: -93.6465
    },
    {
      name: 'Oklahoma State', 
      short_name: 'Okla St', 
      abbreviation: 'OKST',
      mascot: 'Cowboys',
      primary_color: '#FF7300', 
      secondary_color: '#000000',
      location: 'Stillwater, OK',
      latitude: 36.1156,
      longitude: -97.0584
    },
    {
      name: 'West Virginia', 
      short_name: 'W Virginia', 
      abbreviation: 'WVU',
      mascot: 'Mountaineers',
      primary_color: '#002855', 
      secondary_color: '#EAAA00',
      location: 'Morgantown, WV',
      latitude: 39.6487,
      longitude: -79.9559
    },
    {
      name: 'Air Force', 
      short_name: 'Air Force', 
      abbreviation: 'AF',
      mascot: 'Falcons',
      primary_color: '#003087', 
      secondary_color: '#8A8D8F',
      location: 'Colorado Springs, CO',
      latitude: 38.9983,
      longitude: -104.8613
    },
    {
      name: 'California Baptist', 
      short_name: 'Cal Baptist', 
      abbreviation: 'CBU',
      mascot: 'Lancers',
      primary_color: '#00263A', 
      secondary_color: '#0082CA',
      location: 'Riverside, CA',
      latitude: 33.9381,
      longitude: -117.4255
    },
    {
      name: 'Missouri', 
      short_name: 'Missouri', 
      abbreviation: 'MIZ',
      mascot: 'Tigers',
      primary_color: '#F1B82D', 
      secondary_color: '#000000',
      location: 'Columbia, MO',
      latitude: 38.9404,
      longitude: -92.3277
    },
    {
      name: 'North Dakota State', 
      short_name: 'ND State', 
      abbreviation: 'NDSU',
      mascot: 'Bison',
      primary_color: '#005643', 
      secondary_color: '#FFC82E',
      location: 'Fargo, ND',
      latitude: 46.8907,
      longitude: -96.7954
    },
    {
      name: 'Northern Colorado', 
      short_name: 'N Colorado', 
      abbreviation: 'UNC',
      mascot: 'Bears',
      primary_color: '#013C65', 
      secondary_color: '#F6B000',
      location: 'Greeley, CO',
      latitude: 40.4233,
      longitude: -104.7452
    },
    {
      name: 'Northern Iowa', 
      short_name: 'N Iowa', 
      abbreviation: 'UNI',
      mascot: 'Panthers',
      primary_color: '#4B116F', 
      secondary_color: '#FFCC00',
      location: 'Cedar Falls, IA',
      latitude: 42.5144,
      longitude: -92.4603
    },
    {
      name: 'Oklahoma', 
      short_name: 'Oklahoma', 
      abbreviation: 'OU',
      mascot: 'Sooners',
      primary_color: '#841617', 
      secondary_color: '#FDF9D8',
      location: 'Norman, OK',
      latitude: 35.2226,
      longitude: -97.4395
    },
    {
      name: 'South Dakota State', 
      short_name: 'SD State', 
      abbreviation: 'SDSU',
      mascot: 'Jackrabbits',
      primary_color: '#0033A0', 
      secondary_color: '#FFB71B',
      location: 'Brookings, SD',
      latitude: 44.3114,
      longitude: -96.7984
    },
    {
      name: 'Utah Valley', 
      short_name: 'Utah Valley', 
      abbreviation: 'UVU',
      mascot: 'Wolverines',
      primary_color: '#275D38', 
      secondary_color: '#FFFFFF',
      location: 'Orem, UT',
      latitude: 40.2969,
      longitude: -111.6949
    },
    {
      name: 'Wyoming', 
      short_name: 'Wyoming', 
      abbreviation: 'WYO',
      mascot: 'Cowboys',
      primary_color: '#492F24', 
      secondary_color: '#FFC425',
      location: 'Laramie, WY',
      latitude: 41.3149,
      longitude: -105.5666
    }
  ]);
}; 