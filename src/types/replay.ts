// 3D Replay Engine Types

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface PlayerReplayState {
  playerId: string;
  jerseyNumber: number;
  position: Position3D;
  rotation: number; // Y-axis rotation in radians
  hasBall: boolean;
  isActive: boolean; // Part of the current play
}

export interface BallState {
  position: Position3D;
  inPlay: boolean;
  carrier?: string; // playerId
}

export interface ReplayKeyframe {
  time: number; // 0-1 normalized time within the event
  players: {
    home: PlayerReplayState[];
    away: PlayerReplayState[];
  };
  ball: BallState;
}

export type ReplayEventType = 
  | 'try'
  | 'conversion'
  | 'penalty_kick'
  | 'scrum'
  | 'lineout'
  | 'tackle'
  | 'turnover'
  | 'kickoff';

export interface ReplayEvent {
  id: string;
  matchMinute: number;
  type: ReplayEventType;
  team: 'home' | 'away';
  description: string;
  scorerName?: string;
  keyframes: ReplayKeyframe[];
  duration: number; // seconds for full replay
}

export interface ReplayMatch {
  id: string;
  homeTeam: {
    name: string;
    shortName: string;
    primaryColor: string;
    secondaryColor: string;
  };
  awayTeam: {
    name: string;
    shortName: string;
    primaryColor: string;
    secondaryColor: string;
  };
  homeScore: number;
  awayScore: number;
  events: ReplayEvent[];
}

// Rugby pitch dimensions in meters (standard: 100m x 70m playing area)
export const PITCH_DIMENSIONS = {
  length: 100, // Try line to try line
  width: 70,
  inGoalDepth: 10, // Behind each try line
  totalLength: 120, // Including in-goal areas
  // Markings
  twentyTwoLine: 22,
  tenMeterLine: 10,
  fiftyMeterLine: 50,
  fiveMetreLine: 5,
  fifteenMeterLine: 15,
};

// Scale factor for 3D scene (meters to scene units)
export const SCENE_SCALE = 0.1;

// Player capsule dimensions
export const PLAYER_DIMENSIONS = {
  radius: 0.4,
  height: 1.8,
};
