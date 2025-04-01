export interface HistoricalData {
  year: number;
  score: number;
  result: string;
}

export interface ProgramData {
  name: string;
  performance: number;
  recruiting: number;
  facilities: number;
  academics: number;
  tradition: number;
  budget: number;
  overall: number;
}

export interface CompassInsight {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  text: string;
}

export interface CompassPrediction {
  metric: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

export interface CompassData {
  program: ProgramData;
  historical: HistoricalData[];
  insights: CompassInsight[];
  predictions: CompassPrediction[];
}

export interface RankingCardProps {
  title: string;
  ranking: number;
  trend: number;
  subtitle?: string;
}

export interface AIInsightsCardProps {
  insights: CompassInsight[];
}

export interface HistoricalPerformanceCardProps {
  data: HistoricalData[];
}

export interface ProgramComparisonCardProps {
  programs: ProgramData[];
}

export interface SportSelectorProps {
  selectedSport: string;
  onSportChange: (sport: string) => void;
}

export interface CompassScoreCardProps {
  data: ProgramData;
} 