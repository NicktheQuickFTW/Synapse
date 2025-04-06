/**
 * Common types for sport manuals across XII-OS
 */

export interface Measurement {
  minimum?: number;
  maximum?: number;
  recommended?: number;
  unit: string;
  description: string;
}

export interface FieldRequirements {
  length: Measurement;
  width: Measurement;
  surfaceTypes: string[];
  markings: string[];
}

export interface LightingRequirements {
  minimumLevel: Measurement;
  recommendedLevel: Measurement;
  eveningRequired: boolean;
}

export interface FacilityRequirements {
  required: string[];
  recommended: string[];
}

export interface SafetyZone {
  minimumDistance: Measurement;
  description: string;
}

export interface VenueRequirements {
  field: FieldRequirements;
  lighting: LightingRequirements;
  facilities: FacilityRequirements;
  safetyZones: SafetyZone[];
}

export interface WeatherRequirements {
  temperature: {
    minimum: number;
    maximum: number;
    unit: string;
    wetBulbThreshold?: number;
  };
  wind: {
    maximumSpeed: number;
    unit: string;
  };
  precipitation: {
    maximumRate: number;
    unit: string;
    fieldConditions: string[];
  };
  lightningProtocol: {
    delayDuration: number;
    unit: string;
  };
}

export interface GameDuration {
  total: number;
  regulation: number;
  halftime?: number;
  warmup: number;
  unit: string;
}

export interface RestPeriod {
  minimum: number;
  recommended: number;
  unit: string;
}

export interface StartTime {
  time: string;
  description: string;
  priority: number;
}

export interface GameDay {
  day: string;
  priority: number;
  description: string;
}

export interface SeasonLimits {
  gamesPerWeek: number;
  consecutiveAwayGames: number;
}

export interface SchedulingGuidelines {
  gameDuration: GameDuration;
  restPeriod: RestPeriod;
  seasonLimits: SeasonLimits;
  preferredStartTimes: StartTime[];
  traditionalGameDays: GameDay[];
  restrictions: string[];
}

export interface Official {
  role: string;
  count: number;
  description: string;
}

export interface Officials {
  required: Official[];
  optional: Official[];
}

export interface SportManual {
  sport: string;
  version: string;
  lastUpdated: string;
  venue: VenueRequirements;
  weather: WeatherRequirements;
  scheduling: SchedulingGuidelines;
  officials: Officials;
  references: {
    rules: string[];
    scheduling: string[];
    facilities: string[];
    safety: string[];
  };
} 