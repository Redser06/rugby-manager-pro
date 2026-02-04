// Fixture and Schedule Types

export type FixtureStatus = 'scheduled' | 'completed' | 'postponed' | 'cancelled' | 'rescheduled';

export type WeatherCondition = 
  | 'clear' 
  | 'cloudy' 
  | 'light_rain' 
  | 'heavy_rain' 
  | 'storm' 
  | 'snow' 
  | 'fog' 
  | 'frozen_pitch';

export interface WeatherEvent {
  condition: WeatherCondition;
  severity: 'minor' | 'moderate' | 'severe';
  affectsMatch: boolean;
  description: string;
}

export interface TravelInfo {
  distance: number; // km
  travelTime: number; // hours
  requiresOvernight: boolean;
  departureDayOffset: number; // days before match to travel (0 = same day, 1 = day before)
  trainingRestriction: boolean; // can't train the day before if traveling
}

export interface Fixture {
  id: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  venue: string;
  status: FixtureStatus;
  weather?: WeatherEvent;
  travel?: TravelInfo;
  // Results (if completed)
  homeScore?: number;
  awayScore?: number;
  // Rescheduling
  originalWeek?: number;
  rescheduledWeek?: number;
  postponementReason?: string;
}

export interface SeasonSchedule {
  seasonNumber: number;
  leagueId: string;
  fixtures: Fixture[];
  currentWeek: number;
  totalWeeks: number;
}

// Team location data for travel calculations
export interface TeamLocation {
  teamId: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  hemisphere: 'northern' | 'southern';
}

// Weather probabilities by month and location
export interface WeatherProfile {
  region: string;
  winterStormChance: number; // Dec-Feb for NH, Jun-Aug for SH
  autumnRainChance: number;
  springRainChance: number;
  summerClearChance: number;
}

// Fixture generation config
export interface ScheduleConfig {
  rounds: number; // 1 = single round robin, 2 = home and away
  weeksBetweenLegs: number; // Gap between first and return fixture
  internationalBreaks: number[]; // Weeks with no fixtures
  byeWeeks: boolean; // Include bye weeks for odd team counts
}
