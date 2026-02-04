import { ReplayEvent, ReplayKeyframe, PlayerReplayState, Position3D, PITCH_DIMENSIONS } from '@/types/replay';
import { Team, MatchEvent } from '@/types/game';

// Generate starting positions for a scrum
function generateScrumPositions(isHome: boolean, atMeter: number): PlayerReplayState[] {
  const side = isHome ? 1 : -1;
  const zOffset = isHome ? -2 : 2;
  
  // Convert meter position to scene coordinates
  const yPos = (atMeter - PITCH_DIMENSIONS.fiftyMeterLine) * 0.1;
  
  const positions: PlayerReplayState[] = [];
  
  // Front row (1, 2, 3)
  for (let i = 0; i < 3; i++) {
    positions.push({
      playerId: `${isHome ? 'home' : 'away'}-${i + 1}`,
      jerseyNumber: i + 1,
      position: { x: (i - 1) * 0.8, y: 0.9, z: yPos + zOffset },
      rotation: isHome ? 0 : Math.PI,
      hasBall: false,
      isActive: true,
    });
  }
  
  // Second row (4, 5)
  for (let i = 0; i < 2; i++) {
    positions.push({
      playerId: `${isHome ? 'home' : 'away'}-${i + 4}`,
      jerseyNumber: i + 4,
      position: { x: (i - 0.5) * 1.2, y: 0.9, z: yPos + zOffset + side * 1.5 },
      rotation: isHome ? 0 : Math.PI,
      hasBall: false,
      isActive: true,
    });
  }
  
  // Back row (6, 7, 8)
  for (let i = 0; i < 3; i++) {
    positions.push({
      playerId: `${isHome ? 'home' : 'away'}-${i + 6}`,
      jerseyNumber: i + 6,
      position: { x: (i - 1) * 1.0, y: 0.9, z: yPos + zOffset + side * 3 },
      rotation: isHome ? 0 : Math.PI,
      hasBall: false,
      isActive: true,
    });
  }
  
  // Scrum-half (9)
  positions.push({
    playerId: `${isHome ? 'home' : 'away'}-9`,
    jerseyNumber: 9,
    position: { x: -2, y: 0.9, z: yPos + zOffset + side * 1 },
    rotation: isHome ? Math.PI / 2 : -Math.PI / 2,
    hasBall: isHome,
    isActive: true,
  });
  
  // Backs spread out (10-15)
  const backPositions = [
    { x: -3, z: 8 },  // 10 - Fly-half
    { x: -5, z: 12 }, // 11 - Left wing
    { x: -2, z: 14 }, // 12 - Inside centre
    { x: 0, z: 16 },  // 13 - Outside centre
    { x: 5, z: 12 },  // 14 - Right wing
    { x: 0, z: 20 },  // 15 - Fullback
  ];
  
  backPositions.forEach((pos, i) => {
    positions.push({
      playerId: `${isHome ? 'home' : 'away'}-${i + 10}`,
      jerseyNumber: i + 10,
      position: { x: pos.x * side * 0.3, y: 0.9, z: yPos + pos.z * side * 0.1 },
      rotation: isHome ? 0 : Math.PI,
      hasBall: false,
      isActive: false,
    });
  });
  
  return positions;
}

// Generate a try scoring sequence
function generateTryKeyframes(scoringTeam: 'home' | 'away', scorerNumber: number): ReplayKeyframe[] {
  const isHome = scoringTeam === 'home';
  const direction = isHome ? 1 : -1;
  const tryLineZ = direction * 5; // Near try line
  
  const keyframes: ReplayKeyframe[] = [];
  
  // Starting position - receiving pass
  const startZ = direction * 2;
  const homePositions = generateScrumPositions(true, 30);
  const awayPositions = generateScrumPositions(false, 30);
  
  // Find scorer and give them the ball
  const scorerTeam = isHome ? homePositions : awayPositions;
  const scorerIndex = scorerTeam.findIndex(p => p.jerseyNumber === scorerNumber);
  if (scorerIndex >= 0) {
    scorerTeam[scorerIndex].hasBall = true;
    scorerTeam[scorerIndex].position = { x: 1, y: 0.9, z: startZ };
    scorerTeam[scorerIndex].isActive = true;
  }
  
  keyframes.push({
    time: 0,
    players: { home: homePositions, away: awayPositions },
    ball: { position: { x: 1, y: 1, z: startZ }, inPlay: true, carrier: `${scoringTeam}-${scorerNumber}` },
  });
  
  // Mid run
  const midZ = (startZ + tryLineZ) / 2;
  const midFrame = JSON.parse(JSON.stringify(keyframes[0])) as ReplayKeyframe;
  midFrame.time = 0.5;
  const midScorer = (isHome ? midFrame.players.home : midFrame.players.away).find(p => p.jerseyNumber === scorerNumber);
  if (midScorer) {
    midScorer.position = { x: 0.5, y: 0.9, z: midZ };
  }
  midFrame.ball.position = { x: 0.5, y: 1, z: midZ };
  keyframes.push(midFrame);
  
  // Scoring
  const endFrame = JSON.parse(JSON.stringify(midFrame)) as ReplayKeyframe;
  endFrame.time = 1;
  const endScorer = (isHome ? endFrame.players.home : endFrame.players.away).find(p => p.jerseyNumber === scorerNumber);
  if (endScorer) {
    endScorer.position = { x: 0, y: 0.5, z: tryLineZ }; // Diving
  }
  endFrame.ball.position = { x: 0, y: 0.3, z: tryLineZ + direction * 0.5 };
  keyframes.push(endFrame);
  
  return keyframes;
}

// Generate lineout positions
function generateLineoutKeyframes(throwingTeam: 'home' | 'away'): ReplayKeyframe[] {
  const keyframes: ReplayKeyframe[] = [];
  const isHome = throwingTeam === 'home';
  const lineX = 3.5; // 35m from touchline at scale
  
  // Home lineout positions
  const homeLineout: PlayerReplayState[] = [];
  const awayLineout: PlayerReplayState[] = [];
  
  // Jumpers and lifters in line
  for (let i = 0; i < 7; i++) {
    const zPos = i * 0.15;
    homeLineout.push({
      playerId: `home-${i + 1}`,
      jerseyNumber: i + 1,
      position: { x: lineX - 0.5, y: i === 3 ? 2.5 : 0.9, z: zPos },
      rotation: Math.PI / 2,
      hasBall: false,
      isActive: true,
    });
    awayLineout.push({
      playerId: `away-${i + 1}`,
      jerseyNumber: i + 1,
      position: { x: lineX + 0.5, y: 0.9, z: zPos },
      rotation: -Math.PI / 2,
      hasBall: false,
      isActive: true,
    });
  }
  
  // Hooker throwing
  const hookerTeam = isHome ? homeLineout : awayLineout;
  hookerTeam[1].position = { x: lineX - (isHome ? 2 : -2), y: 0.9, z: -0.3 };
  hookerTeam[1].hasBall = true;
  
  // Add remaining backs spread
  for (let i = 8; i <= 15; i++) {
    homeLineout.push({
      playerId: `home-${i}`,
      jerseyNumber: i,
      position: { x: lineX + 2 + (i - 8) * 0.3, y: 0.9, z: 0.5 },
      rotation: 0,
      hasBall: false,
      isActive: false,
    });
    awayLineout.push({
      playerId: `away-${i}`,
      jerseyNumber: i,
      position: { x: lineX - 2 - (i - 8) * 0.3, y: 0.9, z: 0.5 },
      rotation: Math.PI,
      hasBall: false,
      isActive: false,
    });
  }
  
  keyframes.push({
    time: 0,
    players: { home: homeLineout, away: awayLineout },
    ball: { position: hookerTeam[1].position, inPlay: true, carrier: `${throwingTeam}-2` },
  });
  
  // Ball in air
  const midFrame = JSON.parse(JSON.stringify(keyframes[0])) as ReplayKeyframe;
  midFrame.time = 0.4;
  const midHooker = (isHome ? midFrame.players.home : midFrame.players.away)[1];
  midHooker.hasBall = false;
  midFrame.ball = { position: { x: lineX, y: 3, z: 0.45 }, inPlay: true };
  keyframes.push(midFrame);
  
  // Ball caught
  const endFrame = JSON.parse(JSON.stringify(midFrame)) as ReplayKeyframe;
  endFrame.time = 1;
  const catcher = (isHome ? endFrame.players.home : endFrame.players.away)[3]; // Jumper at 4
  catcher.hasBall = true;
  catcher.position.y = 2.5;
  endFrame.ball = { position: catcher.position, inPlay: true, carrier: `${throwingTeam}-4` };
  keyframes.push(endFrame);
  
  return keyframes;
}

// Generate kickoff positions
function generateKickoffKeyframes(kickingTeam: 'home' | 'away'): ReplayKeyframe[] {
  const keyframes: ReplayKeyframe[] = [];
  const isHome = kickingTeam === 'home';
  
  // Players spread across the pitch
  const homePlayers: PlayerReplayState[] = [];
  const awayPlayers: PlayerReplayState[] = [];
  
  for (let i = 1; i <= 15; i++) {
    const xSpread = (i % 5 - 2) * 1.2;
    const zHome = isHome ? -2 - Math.floor(i / 5) * 0.8 : 2 + Math.floor(i / 5) * 0.8;
    const zAway = isHome ? 2 + Math.floor(i / 5) * 0.8 : -2 - Math.floor(i / 5) * 0.8;
    
    homePlayers.push({
      playerId: `home-${i}`,
      jerseyNumber: i,
      position: { x: xSpread, y: 0.9, z: zHome },
      rotation: isHome ? 0 : Math.PI,
      hasBall: i === 10 && isHome,
      isActive: i === 10 && isHome,
    });
    
    awayPlayers.push({
      playerId: `away-${i}`,
      jerseyNumber: i,
      position: { x: xSpread, y: 0.9, z: zAway },
      rotation: isHome ? Math.PI : 0,
      hasBall: i === 10 && !isHome,
      isActive: i === 10 && !isHome,
    });
  }
  
  const kicker = isHome ? homePlayers[9] : awayPlayers[9];
  kicker.position = { x: 0, y: 0.9, z: 0 };
  
  keyframes.push({
    time: 0,
    players: { home: homePlayers, away: awayPlayers },
    ball: { position: { x: 0, y: 0.5, z: 0 }, inPlay: true, carrier: `${kickingTeam}-10` },
  });
  
  // Ball in air
  const midFrame = JSON.parse(JSON.stringify(keyframes[0])) as ReplayKeyframe;
  midFrame.time = 0.5;
  midFrame.ball = { position: { x: 0, y: 4, z: isHome ? 3 : -3 }, inPlay: true };
  const midKicker = (isHome ? midFrame.players.home : midFrame.players.away)[9];
  midKicker.hasBall = false;
  keyframes.push(midFrame);
  
  return keyframes;
}

// Generate tackle/turnover positions
function generateTackleKeyframes(tacklingTeam: 'home' | 'away'): ReplayKeyframe[] {
  const keyframes: ReplayKeyframe[] = [];
  const isHome = tacklingTeam === 'home';
  const ballCarrier = isHome ? 'away' : 'home';
  
  const homePlayers: PlayerReplayState[] = [];
  const awayPlayers: PlayerReplayState[] = [];
  
  // Simple scattered formation
  for (let i = 1; i <= 15; i++) {
    homePlayers.push({
      playerId: `home-${i}`,
      jerseyNumber: i,
      position: { 
        x: (Math.random() - 0.5) * 4, 
        y: 0.9, 
        z: -1 + Math.random() * 0.5 
      },
      rotation: 0,
      hasBall: false,
      isActive: i === 7, // Tackler
    });
    
    awayPlayers.push({
      playerId: `away-${i}`,
      jerseyNumber: i,
      position: { 
        x: (Math.random() - 0.5) * 4, 
        y: 0.9, 
        z: 1 + Math.random() * 0.5 
      },
      rotation: Math.PI,
      hasBall: i === 12 && !isHome,
      isActive: i === 12,
    });
  }
  
  // Set up tackle scenario
  const carrier = (isHome ? awayPlayers : homePlayers)[11]; // 12
  carrier.position = { x: 0.5, y: 0.9, z: 0 };
  carrier.hasBall = true;
  
  const tackler = (isHome ? homePlayers : awayPlayers)[6]; // 7
  tackler.position = { x: -0.5, y: 0.9, z: -0.3 };
  tackler.isActive = true;
  
  keyframes.push({
    time: 0,
    players: { home: homePlayers, away: awayPlayers },
    ball: { position: carrier.position, inPlay: true, carrier: `${ballCarrier}-12` },
  });
  
  // Tackle made
  const endFrame = JSON.parse(JSON.stringify(keyframes[0])) as ReplayKeyframe;
  endFrame.time = 1;
  const endCarrier = (isHome ? endFrame.players.away : endFrame.players.home)[11];
  const endTackler = (isHome ? endFrame.players.home : endFrame.players.away)[6];
  
  endCarrier.position = { x: 0, y: 0.4, z: 0 };
  endTackler.position = { x: 0, y: 0.4, z: -0.2 };
  endFrame.ball = { position: { x: 0, y: 0.3, z: 0 }, inPlay: true };
  
  keyframes.push(endFrame);
  
  return keyframes;
}

// Convert match events to replay events
export function generateReplayEvents(
  homeTeam: Team,
  awayTeam: Team,
  matchEvents: MatchEvent[]
): ReplayEvent[] {
  const replayEvents: ReplayEvent[] = [];
  
  matchEvents.forEach((event, index) => {
    const isHome = event.team === 'home';
    const team = isHome ? homeTeam : awayTeam;
    
    let keyframes: ReplayKeyframe[] = [];
    let type: ReplayEvent['type'] = 'try';
    let duration = 5;
    
    switch (event.type) {
      case 'try':
        type = 'try';
        keyframes = generateTryKeyframes(
          event.team, 
          event.player?.positionNumber || 11
        );
        duration = 8;
        break;
      case 'conversion':
      case 'penalty':
        type = event.type === 'conversion' ? 'conversion' : 'penalty_kick';
        keyframes = generateKickoffKeyframes(event.team);
        duration = 4;
        break;
      case 'yellow_card':
      case 'red_card':
        type = 'tackle';
        keyframes = generateTackleKeyframes(event.team);
        duration = 3;
        break;
      default:
        type = 'tackle';
        keyframes = generateTackleKeyframes(event.team === 'home' ? 'away' : 'home');
        duration = 3;
    }
    
    replayEvents.push({
      id: `replay-${index}`,
      matchMinute: event.minute,
      type,
      team: event.team,
      description: event.description,
      scorerName: event.player ? `${event.player.firstName} ${event.player.lastName}` : undefined,
      keyframes,
      duration,
    });
  });
  
  // Add set pieces between events
  if (replayEvents.length > 0) {
    // Add a scrum before first try
    const scrumEvent: ReplayEvent = {
      id: 'replay-scrum-1',
      matchMinute: 5,
      type: 'scrum',
      team: 'home',
      description: 'Scrum to home team',
      keyframes: [{
        time: 0,
        players: { 
          home: generateScrumPositions(true, 40),
          away: generateScrumPositions(false, 40),
        },
        ball: { position: { x: 0, y: 0.5, z: -1 }, inPlay: true, carrier: 'home-9' },
      }],
      duration: 4,
    };
    
    const lineoutEvent: ReplayEvent = {
      id: 'replay-lineout-1',
      matchMinute: 15,
      type: 'lineout',
      team: 'home',
      description: 'Lineout to home team',
      keyframes: generateLineoutKeyframes('home'),
      duration: 5,
    };
    
    replayEvents.unshift(scrumEvent, lineoutEvent);
  }
  
  return replayEvents.sort((a, b) => a.matchMinute - b.matchMinute);
}
