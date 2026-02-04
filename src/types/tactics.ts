// Forward attacking shapes - how the 8 forwards are configured in attack
export type ForwardPodConfig = '2-4-2' | '1-3-3-1' | '4-4' | '3-2-3' | '2-3-3' | '1-4-3';

export interface AttackingShape {
  id: string;
  name: string;
  config: ForwardPodConfig;
  description: string;
  strengths: string[];
  weaknesses: string[];
  // Pod roles: how many in each pod (left to right across the pitch)
  pods: ForwardPod[];
}

export interface ForwardPod {
  position: 'blindside' | 'narrow_left' | 'ruck' | 'narrow_right' | 'openside';
  playerCount: number;
  role: 'carry' | 'decoy' | 'support' | 'clear_out';
}

// Predefined attacking shapes
export const ATTACKING_SHAPES: AttackingShape[] = [
  {
    id: 'shape_242',
    name: '2-4-2 Wide Pods',
    config: '2-4-2',
    description: 'Two wide pods with four at the ruck. Good for expansive play with multiple wide options.',
    strengths: ['Quick ball to edges', 'Multiple wide threats', 'Good for line breaks'],
    weaknesses: ['Fewer carriers in midfield', 'Can be isolated on turnover'],
    pods: [
      { position: 'blindside', playerCount: 2, role: 'carry' },
      { position: 'ruck', playerCount: 4, role: 'clear_out' },
      { position: 'openside', playerCount: 2, role: 'carry' }
    ]
  },
  {
    id: 'shape_1331',
    name: '1-3-3-1 Stack',
    config: '1-3-3-1',
    description: 'Staggered depth formation. Creates multiple options at different depths.',
    strengths: ['Good offloading options', 'Creates depth', 'Flexible attack direction'],
    weaknesses: ['Complex timing required', 'Slower to set'],
    pods: [
      { position: 'blindside', playerCount: 1, role: 'decoy' },
      { position: 'narrow_left', playerCount: 3, role: 'carry' },
      { position: 'narrow_right', playerCount: 3, role: 'carry' },
      { position: 'openside', playerCount: 1, role: 'decoy' }
    ]
  },
  {
    id: 'shape_44',
    name: '4-4 Power',
    config: '4-4',
    description: 'Two tight pods of four either side of the ruck. Maximum carrying power.',
    strengths: ['Powerful carries', 'Hard to stop momentum', 'Good ruck security'],
    weaknesses: ['Predictable', 'Limited width', 'Slow tempo'],
    pods: [
      { position: 'narrow_left', playerCount: 4, role: 'carry' },
      { position: 'narrow_right', playerCount: 4, role: 'carry' }
    ]
  },
  {
    id: 'shape_323',
    name: '3-2-3 Balanced',
    config: '3-2-3',
    description: 'Balanced shape with pods of three and a central cleaning pair.',
    strengths: ['Good balance', 'Flexible', 'Sustainable tempo'],
    weaknesses: ['Jack of all trades', 'Can lack punch'],
    pods: [
      { position: 'blindside', playerCount: 3, role: 'carry' },
      { position: 'ruck', playerCount: 2, role: 'clear_out' },
      { position: 'openside', playerCount: 3, role: 'carry' }
    ]
  },
  {
    id: 'shape_233',
    name: '2-3-3 Strike',
    config: '2-3-3',
    description: 'Overload one side with carrying power. Good for targeting weak defenders.',
    strengths: ['Creates overloads', 'Targets weak spots', 'Surprise element'],
    weaknesses: ['Unbalanced', 'Predictable if read'],
    pods: [
      { position: 'blindside', playerCount: 2, role: 'decoy' },
      { position: 'narrow_left', playerCount: 3, role: 'carry' },
      { position: 'openside', playerCount: 3, role: 'carry' }
    ]
  },
  {
    id: 'shape_143',
    name: '1-4-3 Hammer',
    config: '1-4-3',
    description: 'Four-man pod targeting the advantage line with a strike pod of three.',
    strengths: ['Dominant central carries', 'Strong clear outs', 'Good second phase'],
    weaknesses: ['Limited blindside options', 'Slow to reload'],
    pods: [
      { position: 'blindside', playerCount: 1, role: 'support' },
      { position: 'ruck', playerCount: 4, role: 'carry' },
      { position: 'openside', playerCount: 3, role: 'carry' }
    ]
  }
];

// Backs patterns and moves
export interface BacksMove {
  id: string;
  name: string;
  description: string;
  startPosition: 'first_receiver' | 'second_receiver' | 'inside_centre';
  movements: BacksMovePoint[];
  riskLevel: 'low' | 'medium' | 'high';
  targetGap: 'inside' | 'outside' | 'overlap' | 'behind';
}

export interface BacksMovePoint {
  position: 9 | 10 | 12 | 13 | 11 | 14 | 15;
  x: number; // 0-100
  y: number; // 0-100
  action: 'pass' | 'run' | 'loop' | 'dummy' | 'kick';
}

export const BACKS_MOVES: BacksMove[] = [
  {
    id: 'move_crash',
    name: 'Crash Ball',
    description: '12 hitting the line flat and hard at first receiver.',
    startPosition: 'first_receiver',
    riskLevel: 'low',
    targetGap: 'inside',
    movements: [
      { position: 10, x: 40, y: 40, action: 'pass' },
      { position: 12, x: 45, y: 50, action: 'run' }
    ]
  },
  {
    id: 'move_miss_13',
    name: 'Miss to 13',
    description: 'Skip pass from 10 to 13, cutting out 12.',
    startPosition: 'first_receiver',
    riskLevel: 'medium',
    targetGap: 'outside',
    movements: [
      { position: 10, x: 40, y: 40, action: 'pass' },
      { position: 12, x: 50, y: 45, action: 'dummy' },
      { position: 13, x: 60, y: 50, action: 'run' }
    ]
  },
  {
    id: 'move_switch',
    name: 'Inside Switch',
    description: '12 runs a switch line with 10 cutting back inside.',
    startPosition: 'first_receiver',
    riskLevel: 'medium',
    targetGap: 'inside',
    movements: [
      { position: 10, x: 40, y: 40, action: 'run' },
      { position: 12, x: 42, y: 48, action: 'pass' },
      { position: 10, x: 38, y: 55, action: 'run' }
    ]
  },
  {
    id: 'move_loop',
    name: '10-12-10 Loop',
    description: '10 passes to 12, loops around to receive again.',
    startPosition: 'first_receiver',
    riskLevel: 'medium',
    targetGap: 'overlap',
    movements: [
      { position: 10, x: 40, y: 40, action: 'pass' },
      { position: 12, x: 48, y: 48, action: 'run' },
      { position: 10, x: 55, y: 52, action: 'loop' }
    ]
  },
  {
    id: 'move_wrap_14',
    name: 'Wrap to Winger',
    description: '13 wraps around 12 to create overlap for 14.',
    startPosition: 'second_receiver',
    riskLevel: 'high',
    targetGap: 'overlap',
    movements: [
      { position: 12, x: 50, y: 45, action: 'pass' },
      { position: 13, x: 58, y: 48, action: 'run' },
      { position: 14, x: 70, y: 55, action: 'run' }
    ]
  },
  {
    id: 'move_tip_on',
    name: 'Tip-On Pass',
    description: '12 tips ball on in contact for 13 hitting the line.',
    startPosition: 'first_receiver',
    riskLevel: 'high',
    targetGap: 'outside',
    movements: [
      { position: 10, x: 40, y: 40, action: 'pass' },
      { position: 12, x: 48, y: 50, action: 'pass' },
      { position: 13, x: 55, y: 55, action: 'run' }
    ]
  }
];

// Kicking strategies
export interface KickingStrategy {
  id: string;
  name: string;
  description: string;
  icon: string;
  primaryUse: string[];
  fieldPosition: 'own_22' | 'own_half' | 'opposition_half' | 'opposition_22' | 'anywhere';
  contestable: boolean;
  territorialGain: 'high' | 'medium' | 'low';
}

export const KICKING_STRATEGIES: KickingStrategy[] = [
  {
    id: 'kick_box',
    name: 'Box Kick',
    description: 'High spiral kick from 9 behind the ruck, targeting space behind the defensive line.',
    icon: '📦',
    primaryUse: ['Exit own 22', 'Contest in air', 'Pressure fullback'],
    fieldPosition: 'own_22',
    contestable: true,
    territorialGain: 'medium'
  },
  {
    id: 'kick_contest',
    name: 'Kick & Contest',
    description: 'Up-and-under kick designed to be contested in the air by chasers.',
    icon: '⬆️',
    primaryUse: ['Win turnover', 'Pressure opposition', 'Force errors'],
    fieldPosition: 'opposition_half',
    contestable: true,
    territorialGain: 'low'
  },
  {
    id: 'kick_territorial',
    name: 'Territorial Kick',
    description: 'Long spiral kick to push opposition back towards their try line.',
    icon: '🎯',
    primaryUse: ['Gain territory', 'Pin opposition', 'Field position'],
    fieldPosition: 'own_half',
    contestable: false,
    territorialGain: 'high'
  },
  {
    id: 'kick_5022',
    name: '50:22',
    description: 'Kick from own half that bounces into touch in opposition 22. Rewards attacking lineout.',
    icon: '🏉',
    primaryUse: ['Lineout in attacking position', 'High reward play'],
    fieldPosition: 'own_half',
    contestable: false,
    territorialGain: 'high'
  },
  {
    id: 'kick_grubber',
    name: 'Grubber Kick',
    description: 'Low kick along the ground, targeting space behind defence for chase.',
    icon: '⚽',
    primaryUse: ['In-goal chase', 'Behind winger', 'Force 22 dropout'],
    fieldPosition: 'opposition_22',
    contestable: false,
    territorialGain: 'low'
  },
  {
    id: 'kick_crossfield',
    name: 'Cross-field Kick',
    description: 'Kick to the far side of the pitch to exploit space or create 1-on-1.',
    icon: '↗️',
    primaryUse: ['Create try chance', 'Exploit weak defender', 'Winger isolation'],
    fieldPosition: 'opposition_half',
    contestable: true,
    territorialGain: 'low'
  },
  {
    id: 'kick_chip',
    name: 'Chip & Chase',
    description: 'Short chip kick over defenders to regather or pressure.',
    icon: '🎾',
    primaryUse: ['Beat rushing defence', 'Self-regather', 'Create chaos'],
    fieldPosition: 'anywhere',
    contestable: true,
    territorialGain: 'low'
  }
];

// Defensive shapes - primarily about back three positioning
export type DefensiveBackThreeShape = 'umbrella' | 'flat_line' | 'sweeper' | 'aggressive';

export interface DefensiveShape {
  id: string;
  name: string;
  shape: DefensiveBackThreeShape;
  description: string;
  wingerDepth: 'in_line' | 'dropped' | 'deep';
  fullbackDepth: 'flat' | 'sweeper' | 'deep';
  strengths: string[];
  weaknesses: string[];
  bestAgainst: string[];
}

export const DEFENSIVE_SHAPES: DefensiveShape[] = [
  {
    id: 'def_umbrella',
    name: 'Umbrella Defence',
    shape: 'umbrella',
    description: 'Both wingers drop back with fullback, forming an arc to cover kicks.',
    wingerDepth: 'deep',
    fullbackDepth: 'deep',
    strengths: ['Excellent kick coverage', 'Prevents 50:22', 'Secure under high ball'],
    weaknesses: ['Fewer edge defenders', 'Vulnerable to wide attack'],
    bestAgainst: ['Kicking teams', 'Territorial game plans']
  },
  {
    id: 'def_flat',
    name: 'Flat Line',
    shape: 'flat_line',
    description: 'Wingers stay in the defensive line, fullback covers behind.',
    wingerDepth: 'in_line',
    fullbackDepth: 'sweeper',
    strengths: ['Maximum line defenders', 'Pressure on edges', 'Rush defence possible'],
    weaknesses: ['Kick coverage relies on fullback', 'Can be exploited by grubbers'],
    bestAgainst: ['Expansive running teams', 'Wide attack patterns']
  },
  {
    id: 'def_sweeper',
    name: 'Sweeper System',
    shape: 'sweeper',
    description: 'One winger in line, one dropped. Fullback as last line.',
    wingerDepth: 'dropped',
    fullbackDepth: 'deep',
    strengths: ['Balanced coverage', 'Flexible response', 'Good against varied attacks'],
    weaknesses: ['Asymmetric', 'Requires communication'],
    bestAgainst: ['Mixed attack teams', 'Unpredictable opposition']
  },
  {
    id: 'def_aggressive',
    name: 'Aggressive Line',
    shape: 'aggressive',
    description: 'All back three in line, rapid line speed to shut down space.',
    wingerDepth: 'in_line',
    fullbackDepth: 'flat',
    strengths: ['Maximum pressure', 'Forces errors', 'Dominates territory'],
    weaknesses: ['Very vulnerable to kicks', 'High risk if beaten'],
    bestAgainst: ['Poor kicking teams', 'One-dimensional attack']
  }
];

// Extended team tactics to include new shape configurations
export interface ExtendedTactics {
  attackingShape: ForwardPodConfig;
  selectedBacksMoves: string[]; // IDs of BacksMove
  primaryKickingStrategies: string[]; // IDs of KickingStrategy (max 3)
  defensiveShape: DefensiveBackThreeShape;
  attackPatterns: AttackPattern[]; // Multi-phase attack patterns
}

// Multi-phase attack patterns
export type PhaseActionType = 'forward_carry' | 'backs_move' | 'kick' | 'reset';

export interface PhaseAction {
  id: string;
  type: PhaseActionType;
  // For forward_carry
  shape?: ForwardPodConfig;
  podTarget?: 'blindside' | 'openside' | 'pick_and_go' | 'crash';
  // For backs_move
  moveId?: string;
  // For kick
  kickId?: string;
  // For reset
  resetType?: 'quick_ball' | 'slow_set' | 'switch_point';
}

export interface AttackPhase {
  id: string;
  phaseNumber: number;
  name: string;
  actions: PhaseAction[];
  intent: 'gain_yards' | 'create_space' | 'target_edge' | 'score' | 'build_pressure';
  notes?: string;
}

export interface AttackPattern {
  id: string;
  name: string;
  description: string;
  trigger: 'lineout' | 'scrum' | 'penalty' | 'phase_play' | 'turnover';
  fieldZone: 'own_22' | 'own_half' | 'midfield' | 'opposition_half' | 'opposition_22';
  phases: AttackPhase[];
  expectedDuration: number; // in phases/minutes
  riskProfile: 'conservative' | 'balanced' | 'aggressive';
  primaryObjective: string;
  createdAt?: Date;
}

// Preset pattern templates
export const PATTERN_TEMPLATES: Partial<AttackPattern>[] = [
  {
    name: 'Power Build',
    description: 'Methodical phase play using forward carriers to suck in defenders before releasing backs.',
    trigger: 'phase_play',
    riskProfile: 'conservative',
    primaryObjective: 'Tire defence and create space wide',
    expectedDuration: 6,
    phases: [
      {
        id: 'p1',
        phaseNumber: 1,
        name: 'Set Foundation',
        intent: 'gain_yards',
        actions: [
          { id: 'a1', type: 'forward_carry', shape: '4-4', podTarget: 'crash' }
        ]
      },
      {
        id: 'p2',
        phaseNumber: 2,
        name: 'Build Momentum',
        intent: 'gain_yards',
        actions: [
          { id: 'a2', type: 'forward_carry', shape: '4-4', podTarget: 'openside' }
        ]
      },
      {
        id: 'p3',
        phaseNumber: 3,
        name: 'Switch Point',
        intent: 'create_space',
        actions: [
          { id: 'a3', type: 'reset', resetType: 'switch_point' }
        ]
      },
      {
        id: 'p4',
        phaseNumber: 4,
        name: 'Strike Wide',
        intent: 'target_edge',
        actions: [
          { id: 'a4', type: 'backs_move', moveId: 'move_miss_13' }
        ]
      }
    ]
  },
  {
    name: 'Quick Strike',
    description: 'Fast tempo attack looking to score within 3 phases using backs movement.',
    trigger: 'lineout',
    riskProfile: 'aggressive',
    primaryObjective: 'Create try-scoring opportunity quickly',
    expectedDuration: 3,
    phases: [
      {
        id: 'p1',
        phaseNumber: 1,
        name: 'Initial Thrust',
        intent: 'gain_yards',
        actions: [
          { id: 'a1', type: 'backs_move', moveId: 'move_crash' }
        ]
      },
      {
        id: 'p2',
        phaseNumber: 2,
        name: 'Quick Recycle',
        intent: 'create_space',
        actions: [
          { id: 'a2', type: 'reset', resetType: 'quick_ball' },
          { id: 'a3', type: 'forward_carry', shape: '2-4-2', podTarget: 'blindside' }
        ]
      },
      {
        id: 'p3',
        phaseNumber: 3,
        name: 'Finish',
        intent: 'score',
        actions: [
          { id: 'a4', type: 'backs_move', moveId: 'move_wrap_14' }
        ]
      }
    ]
  },
  {
    name: 'Territorial Pressure',
    description: 'Use kicks to pin opposition deep and build attacking position.',
    trigger: 'phase_play',
    riskProfile: 'conservative',
    primaryObjective: 'Gain field position through kicking',
    expectedDuration: 4,
    phases: [
      {
        id: 'p1',
        phaseNumber: 1,
        name: 'Set Up',
        intent: 'gain_yards',
        actions: [
          { id: 'a1', type: 'forward_carry', shape: '3-2-3', podTarget: 'crash' }
        ]
      },
      {
        id: 'p2',
        phaseNumber: 2,
        name: 'Territorial Kick',
        intent: 'build_pressure',
        actions: [
          { id: 'a2', type: 'kick', kickId: 'kick_territorial' }
        ]
      },
      {
        id: 'p3',
        phaseNumber: 3,
        name: 'Pressure From Lineout',
        intent: 'gain_yards',
        actions: [
          { id: 'a3', type: 'forward_carry', shape: '4-4', podTarget: 'openside' }
        ]
      },
      {
        id: 'p4',
        phaseNumber: 4,
        name: '50:22 Opportunity',
        intent: 'create_space',
        actions: [
          { id: 'a4', type: 'kick', kickId: 'kick_5022' }
        ]
      }
    ]
  },
  {
    name: 'Edge Attack',
    description: 'Target the wide channels with pods and backs combinations.',
    trigger: 'scrum',
    riskProfile: 'balanced',
    primaryObjective: 'Create overlap on the edges',
    expectedDuration: 4,
    phases: [
      {
        id: 'p1',
        phaseNumber: 1,
        name: 'Wide Pod Carry',
        intent: 'target_edge',
        actions: [
          { id: 'a1', type: 'forward_carry', shape: '2-4-2', podTarget: 'openside' }
        ]
      },
      {
        id: 'p2',
        phaseNumber: 2,
        name: 'Reset Centre',
        intent: 'create_space',
        actions: [
          { id: 'a2', type: 'reset', resetType: 'switch_point' }
        ]
      },
      {
        id: 'p3',
        phaseNumber: 3,
        name: 'Backs Strike',
        intent: 'target_edge',
        actions: [
          { id: 'a3', type: 'backs_move', moveId: 'move_loop' }
        ]
      },
      {
        id: 'p4',
        phaseNumber: 4,
        name: 'Cross-field Finish',
        intent: 'score',
        actions: [
          { id: 'a4', type: 'kick', kickId: 'kick_crossfield' }
        ]
      }
    ]
  }
];
