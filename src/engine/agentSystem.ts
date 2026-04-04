// ========================
// PLAYER AGENT SYSTEM
// ========================

import { Player } from '@/types/game';
import { Contract, Currency, CURRENCY_SYMBOLS } from '@/types/transfer';

// Agent personality types
export type AgentType = 'reasonable' | 'ambitious' | 'disruptive' | 'loyal' | 'aggressive';

export interface PlayerAgent {
  id: string;
  name: string;
  type: AgentType;
  reputation: number; // 1-100
  clientIds: string[]; // player IDs
  greedFactor: number; // 0-1, how much they push for money
  loyaltyFactor: number; // 0-1, how likely to keep player at current club
  mediaInfluence: number; // 0-100, how much they leak to press
}

export interface AgentDemand {
  id: string;
  agentId: string;
  playerId: string;
  type: 'contract_renewal' | 'salary_increase' | 'release_clause' | 'transfer_request' | 'playing_time';
  demandedSalary?: number;
  demandedYears?: number;
  urgency: 'low' | 'medium' | 'high' | 'ultimatum';
  deadline: number; // weeks until they escalate
  frenchLeverage: boolean; // using French club interest as leverage
  leverageClub?: string;
  status: 'active' | 'resolved' | 'escalated' | 'expired';
  playerMorale: number; // how player feels about it (0-100)
  createdWeek: number;
  message: string;
  responseOptions: AgentResponse[];
}

export interface AgentResponse {
  id: string;
  label: string;
  description: string;
  effect: AgentResponseEffect;
}

export interface AgentResponseEffect {
  moraleChange: number;
  salaryOffer?: number;
  yearsOffer?: number;
  resolves: boolean;
  escalates: boolean;
  playerLeaves: boolean;
  teamMoraleImpact: number; // affects whole squad
}

// Agent name pools
const AGENT_FIRST_NAMES = ['John', 'David', 'Michael', 'Patrick', 'Niall', 'Jean-Pierre', 'Marco', 'Willem', 'Craig', 'Brendan', 'Gavin', 'Simon', 'François', 'Klaus', 'Roberto'];
const AGENT_LAST_NAMES = ['Walsh', 'O\'Brien', 'Murphy', 'Smith', 'Durand', 'Rossi', 'van der Berg', 'McAllister', 'Thornton', 'Kelly', 'Robertson', 'Laurent', 'Fischer', 'Morin', 'Barrett'];

const FRENCH_CLUBS = ['Toulouse', 'La Rochelle', 'Racing 92', 'Toulon', 'Bordeaux', 'Montpellier', 'Lyon', 'Clermont', 'Stade Français'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateAgent(): PlayerAgent {
  const types: AgentType[] = ['reasonable', 'reasonable', 'ambitious', 'ambitious', 'disruptive', 'loyal', 'aggressive'];
  const type = pick(types);

  const greedByType: Record<AgentType, [number, number]> = {
    reasonable: [0.2, 0.5],
    ambitious: [0.5, 0.8],
    disruptive: [0.7, 1.0],
    loyal: [0.1, 0.3],
    aggressive: [0.6, 0.9],
  };
  const [gMin, gMax] = greedByType[type];

  return {
    id: Math.random().toString(36).substring(2, 9),
    name: `${pick(AGENT_FIRST_NAMES)} ${pick(AGENT_LAST_NAMES)}`,
    type,
    reputation: 20 + Math.floor(Math.random() * 70),
    clientIds: [],
    greedFactor: gMin + Math.random() * (gMax - gMin),
    loyaltyFactor: type === 'loyal' ? 0.7 + Math.random() * 0.3 : type === 'disruptive' ? 0.1 + Math.random() * 0.2 : 0.3 + Math.random() * 0.4,
    mediaInfluence: type === 'disruptive' ? 60 + Math.floor(Math.random() * 40) : type === 'aggressive' ? 40 + Math.floor(Math.random() * 40) : 10 + Math.floor(Math.random() * 40),
  };
}

// Generate a pool of agents for the game
export function generateAgentPool(count: number = 15): PlayerAgent[] {
  return Array.from({ length: count }, generateAgent);
}

// Assign agents to players (senior players get agents)
export function assignAgentsToPlayers(
  players: Player[],
  agents: PlayerAgent[],
): Record<string, string> { // playerId -> agentId
  const assignments: Record<string, string> = {};

  players.forEach(player => {
    // Players over 21 with overall > 60 have agents
    if (player.age >= 21 && player.overall >= 60) {
      const agent = pick(agents);
      assignments[player.id] = agent.id;
      if (!agent.clientIds.includes(player.id)) {
        agent.clientIds.push(player.id);
      }
    }
  });

  return assignments;
}

// Generate mid-season agent demand
export function generateAgentDemand(
  player: Player,
  contract: Contract,
  agent: PlayerAgent,
  currentWeek: number,
  internationalCaps: number = 0,
): AgentDemand | null {
  // Don't generate demands for long contracts with happy players
  if (contract.yearsRemaining > 2 && agent.type === 'loyal') return null;

  // Trigger conditions
  const isExpiring = contract.yearsRemaining <= 1;
  const isInForm = player.form >= 8;
  const isInternational = internationalCaps > 10;
  const isUnderpaid = player.overall >= 80 && contract.salary < 200000;

  // Probability of demand based on factors
  let demandChance = 0.05; // base 5% per check
  if (isExpiring) demandChance += 0.3;
  if (isInForm) demandChance += 0.15;
  if (isInternational) demandChance += 0.1;
  if (isUnderpaid) demandChance += 0.2;
  demandChance *= (0.5 + agent.greedFactor);

  if (agent.type === 'disruptive') demandChance *= 1.5;
  if (agent.type === 'loyal') demandChance *= 0.4;

  if (Math.random() > demandChance) return null;

  // Irish leverage scenario
  const isIrish = player.nationality === 'Irish' || player.nationality === 'Ireland';
  const useFrenchLeverage = isIrish && (isExpiring || isInForm) && Math.random() > 0.4;
  const leverageClub = useFrenchLeverage ? pick(FRENCH_CLUBS) : undefined;

  // Calculate demanded salary
  const salaryMultiplier = 1 + agent.greedFactor * 0.6 + (isInForm ? 0.15 : 0) + (isInternational ? 0.1 : 0);
  const demandedSalary = Math.round(contract.salary * salaryMultiplier);

  // Determine demand type
  let type: AgentDemand['type'] = 'contract_renewal';
  if (isUnderpaid) type = 'salary_increase';
  if (agent.type === 'disruptive' && Math.random() > 0.6) type = 'transfer_request';

  // Urgency
  let urgency: AgentDemand['urgency'] = 'low';
  if (isExpiring && contract.yearsRemaining === 0) urgency = 'ultimatum';
  else if (isExpiring) urgency = 'high';
  else if (agent.type === 'aggressive') urgency = 'high';
  else if (isInForm) urgency = 'medium';

  const deadlineWeeks = urgency === 'ultimatum' ? 2 : urgency === 'high' ? 4 : urgency === 'medium' ? 8 : 12;

  // Build message
  let message = '';
  if (useFrenchLeverage) {
    message = `${agent.name} has been in touch: "${player.firstName}'s representatives at ${leverageClub} have made a very attractive offer. We love the club, but my client needs to feel valued. Can we discuss an improved package?"`;
  } else if (type === 'transfer_request') {
    message = `${agent.name} called: "Look, ${player.firstName} has given everything to this club. He feels it's time for a new challenge. We'd like to discuss his options."`;
  } else if (urgency === 'ultimatum') {
    message = `${agent.name}: "This is the final call. ${player.firstName}'s contract is up and we need a decision. He has other offers on the table."`;
  } else {
    message = `${agent.name} wants to discuss ${player.firstName} ${player.lastName}'s contract. ${isInForm ? 'His recent form warrants better terms. ' : ''}${isInternational ? 'His international profile has grown significantly. ' : ''}We believe a package of ${CURRENCY_SYMBOLS[contract.currency]}${demandedSalary.toLocaleString()} per year is fair.`;
  }

  // Response options
  const responseOptions: AgentResponse[] = [
    {
      id: 'accept',
      label: 'Accept demands',
      description: `Agree to ${CURRENCY_SYMBOLS[contract.currency]}${demandedSalary.toLocaleString()}/year`,
      effect: { moraleChange: 15, salaryOffer: demandedSalary, yearsOffer: 3, resolves: true, escalates: false, playerLeaves: false, teamMoraleImpact: 5 },
    },
    {
      id: 'negotiate',
      label: 'Counter-offer',
      description: `Offer a compromise at ${CURRENCY_SYMBOLS[contract.currency]}${Math.round(demandedSalary * 0.8).toLocaleString()}/year`,
      effect: { moraleChange: 0, salaryOffer: Math.round(demandedSalary * 0.8), yearsOffer: 2, resolves: false, escalates: false, playerLeaves: false, teamMoraleImpact: 0 },
    },
    {
      id: 'reject',
      label: 'Reject outright',
      description: 'Tell them the current deal stands',
      effect: { moraleChange: -20, resolves: false, escalates: true, playerLeaves: false, teamMoraleImpact: -5 },
    },
    {
      id: 'defer',
      label: 'Ask for time',
      description: 'Defer the conversation to end of season',
      effect: { moraleChange: -5, resolves: false, escalates: false, playerLeaves: false, teamMoraleImpact: 0 },
    },
  ];

  // If French leverage, add a specific option
  if (useFrenchLeverage) {
    responseOptions.push({
      id: 'call_bluff',
      label: 'Call the bluff',
      description: `Tell ${agent.name} you know ${leverageClub} haven't made a formal offer`,
      effect: {
        moraleChange: agent.type === 'disruptive' ? -15 : 5,
        resolves: agent.type !== 'disruptive',
        escalates: agent.type === 'disruptive',
        playerLeaves: false,
        teamMoraleImpact: 0,
      },
    });
  }

  return {
    id: Math.random().toString(36).substring(2, 9),
    agentId: agent.id,
    playerId: player.id,
    type,
    demandedSalary,
    demandedYears: 3,
    urgency,
    deadline: deadlineWeeks,
    frenchLeverage: useFrenchLeverage,
    leverageClub,
    status: 'active',
    playerMorale: urgency === 'ultimatum' ? 30 : urgency === 'high' ? 50 : 70,
    createdWeek: currentWeek,
    message,
    responseOptions,
  };
}

// Process weekly agent activity
export function processWeeklyAgentActivity(
  demands: AgentDemand[],
  currentWeek: number,
): AgentDemand[] {
  return demands.map(demand => {
    if (demand.status !== 'active') return demand;

    const weeksElapsed = currentWeek - demand.createdWeek;

    // Check deadline
    if (weeksElapsed >= demand.deadline) {
      if (demand.urgency === 'ultimatum') {
        return { ...demand, status: 'escalated' as const, playerMorale: Math.max(0, demand.playerMorale - 30) };
      }
      // Escalate urgency
      const nextUrgency: Record<string, AgentDemand['urgency']> = {
        low: 'medium', medium: 'high', high: 'ultimatum',
      };
      return {
        ...demand,
        urgency: nextUrgency[demand.urgency] || 'ultimatum',
        deadline: demand.deadline + (demand.urgency === 'high' ? 2 : 4),
        playerMorale: Math.max(0, demand.playerMorale - 10),
      };
    }

    return demand;
  });
}

// Get agent description for UI
export function getAgentTypeDescription(type: AgentType): string {
  const descriptions: Record<AgentType, string> = {
    reasonable: 'Fair negotiator. Seeks good deals but respects the club relationship.',
    ambitious: 'Always pushing for more. Wants the best deal possible for their clients.',
    disruptive: 'Uses media leaks, French leverage, and pressure tactics. High maintenance.',
    loyal: 'Values long-term relationships. Will keep players at clubs they\'re happy at.',
    aggressive: 'Hard-nosed negotiator. Won\'t accept anything less than top market value.',
  };
  return descriptions[type];
}
