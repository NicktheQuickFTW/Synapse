export type Sport = 'wrestling' | 'basketball' | 'football' | 'baseball' | 'volleyball';

export interface CompassScore {
  totalScore: number;
  components: {
    performance: number;
    roster: number;
    infrastructure: number;
    prestige: number;
    academics: number;
  };
}

export interface ProgramRanking {
  national: number;
  conference: number;
  trend: number;
}

export interface CompassPrediction {
  winLoss: string;
  tournamentSeed: number;
  tournamentFinish: string;
  conferenceStanding: number;
}

export interface CompassInsight {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  title: string;
  description: string;
}

export interface HistoricalData {
  year: number;
  score: number;
  result: string;
}

export interface CompassData {
  sport: Sport;
  compassScore: CompassScore;
  ranking: ProgramRanking;
  predictions: CompassPrediction;
  insights: CompassInsight[];
  historicalData: HistoricalData[];
  meta: {
    lastUpdated: string;
    version: string;
    dataSource: string;
    confidenceLevel: number;
  };
} 