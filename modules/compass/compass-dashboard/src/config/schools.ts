export interface School {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  conference: string;
}

export const SCHOOLS: School[] = [
  {
    id: 'iowa-state',
    name: 'Iowa State',
    shortName: 'ISU',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Iowa_State_Cyclones_logo.svg',
    conference: 'Big 12'
  },
  {
    id: 'oklahoma-state',
    name: 'Oklahoma State',
    shortName: 'OSU',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Oklahoma_State_University_logo.svg',
    conference: 'Big 12'
  },
  {
    id: 'missouri',
    name: 'Missouri',
    shortName: 'MIZZOU',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Missouri_Tigers_logo.svg',
    conference: 'Big 12'
  },
  {
    id: 'arizona-state',
    name: 'Arizona State',
    shortName: 'ASU',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Arizona_State_Sun_Devils_logo.svg',
    conference: 'Big 12'
  },
  {
    id: 'northern-iowa',
    name: 'Northern Iowa',
    shortName: 'UNI',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Northern_Iowa_Panthers_logo.svg',
    conference: 'Big 12'
  }
]; 