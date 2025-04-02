/**
 * Seed file to populate Big 12 sports
 */
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('sports').del()
    .then(function () {
      // Inserts seed entries
      return knex('sports').insert([
        // Fall Sports
        {
          name: 'Football',
          code: 'FB',
          season: 'fall',
          is_active: true,
          metadata: {
            divisions: ['FBS'],
            conference: 'Big 12',
            season_start: 'August',
            season_end: 'December',
            championship: 'Big 12 Championship Game',
            legacy_schools: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
            affiliate_members: []
          }
        },
        {
          name: 'Volleyball',
          code: 'VB',
          season: 'fall',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'August',
            season_end: 'December',
            legacy_schools: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
            affiliate_members: []
          }
        },
        {
          name: 'Soccer',
          code: 'SOC',
          season: 'fall',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'August',
            season_end: 'November',
            championship: 'Big 12 Soccer Championship',
            legacy_schools: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
            affiliate_members: []
          }
        },
        {
          name: 'Cross Country',
          code: 'XC',
          season: 'fall',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'August',
            season_end: 'November',
            championship: 'Big 12 Cross Country Championship',
            legacy_schools: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech'],
            affiliate_members: []
          }
        },

        // Winter Sports
        {
          name: 'Men\'s Basketball',
          code: 'MBB',
          season: 'winter',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'November',
            season_end: 'March',
            championship: 'Big 12 Men\'s Basketball Championship',
            legacy_schools: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
            affiliate_members: []
          }
        },
        {
          name: 'Women\'s Basketball',
          code: 'WBB',
          season: 'winter',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'November',
            season_end: 'March',
            championship: 'Big 12 Women\'s Basketball Championship',
            legacy_schools: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
            affiliate_members: []
          }
        },
        {
          name: 'Wrestling',
          code: 'WR',
          season: 'winter',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'November',
            season_end: 'March',
            championship: 'Big 12 Wrestling Championship',
            legacy_schools: ['Arizona State', 'Iowa State', 'Oklahoma State', 'West Virginia'],
            affiliate_members: ['Air Force', 'Cal Baptist', 'Missouri', 'North Dakota State', 'Northern Colorado', 'Northern Iowa', 'Oklahoma', 'South Dakota State', 'Utah Valley', 'Wyoming']
          }
        },
        {
          name: 'Swimming & Diving',
          code: 'SWIM',
          season: 'winter',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'October',
            season_end: 'March',
            championship: 'Big 12 Swimming & Diving Championship',
            legacy_schools: ['Arizona', 'Arizona State', 'BYU', 'Cincinnati', 'Houston', 'Iowa State', 'Kansas', 'TCU', 'Utah', 'West Virginia'],
            affiliate_members: []
          }
        },
        {
          name: 'Indoor Track & Field',
          code: 'ITF',
          season: 'winter',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'December',
            season_end: 'March',
            championship: 'Big 12 Indoor Track & Field Championship',
            legacy_schools: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech'],
            affiliate_members: []
          }
        },
        {
          name: 'Gymnastics',
          code: 'GYM',
          season: 'winter',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'January',
            season_end: 'April',
            championship: 'Big 12 Gymnastics Championship',
            legacy_schools: ['Arizona', 'Arizona State', 'BYU', 'Iowa State', 'Utah', 'West Virginia'],
            affiliate_members: ['Denver']
          }
        },

        // Spring Sports
        {
          name: 'Baseball',
          code: 'BSB',
          season: 'spring',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'February',
            season_end: 'June',
            championship: 'Big 12 Baseball Championship',
            legacy_schools: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Houston', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
            affiliate_members: []
          }
        },
        {
          name: 'Softball',
          code: 'SB',
          season: 'spring',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'February',
            season_end: 'June',
            championship: 'Big 12 Softball Championship',
            legacy_schools: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Houston', 'Iowa State', 'Kansas', 'Oklahoma State', 'Texas Tech', 'UCF', 'Utah'],
            affiliate_members: []
          }
        },
        {
          name: 'Tennis',
          code: 'TEN',
          season: 'spring',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'January',
            season_end: 'May',
            championship: 'Big 12 Tennis Championship',
            legacy_schools: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
            affiliate_members: []
          }
        },
        {
          name: 'Golf',
          code: 'GOLF',
          season: 'spring',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'February',
            season_end: 'May',
            championship: 'Big 12 Golf Championship',
            legacy_schools: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF'],
            affiliate_members: []
          }
        },
        {
          name: 'Outdoor Track & Field',
          code: 'OTF',
          season: 'spring',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'March',
            season_end: 'June',
            championship: 'Big 12 Outdoor Track & Field Championship',
            legacy_schools: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech'],
            affiliate_members: []
          }
        },
        {
          name: 'Rowing',
          code: 'ROW',
          season: 'spring',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'March',
            season_end: 'May',
            championship: 'Big 12 Rowing Championship',
            legacy_schools: ['Kansas', 'Kansas State', 'UCF', 'West Virginia'],
            affiliate_members: ['Old Dominion', 'Tulsa']
          }
        },
        {
          name: 'Beach Volleyball',
          code: 'BVB',
          season: 'spring',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'March',
            season_end: 'May',
            championship: 'Big 12 Beach Volleyball Championship',
            legacy_schools: ['Arizona', 'Arizona State', 'TCU', 'Utah'],
            affiliate_members: []
          }
        },
        {
          name: 'Lacrosse',
          code: 'LAX',
          season: 'spring',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'February',
            season_end: 'May',
            championship: 'Big 12 Lacrosse Championship',
            legacy_schools: ['Arizona State', 'Cincinnati', 'Colorado'],
            affiliate_members: ['Florida', 'San Diego State', 'UC Davis']
          }
        },
        {
          name: 'Equestrian',
          code: 'EQ',
          season: 'spring',
          is_active: true,
          metadata: {
            divisions: ['Division I'],
            conference: 'Big 12',
            season_start: 'September',
            season_end: 'April',
            championship: 'Big 12 Equestrian Championship',
            legacy_schools: ['Baylor', 'Oklahoma State', 'TCU'],
            affiliate_members: ['Fresno State']
          }
        }
      ]);
    });
}; 