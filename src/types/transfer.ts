import { Player } from './game';

// Currency types
export type Currency = 'EUR' | 'GBP' | 'NZD' | 'ZAR' | 'AUD';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  GBP: '£',
  NZD: 'NZ$',
  ZAR: 'R',
  AUD: 'A$'
};

// Exchange rates to EUR for standardization
export const EXCHANGE_RATES: Record<Currency, number> = {
  EUR: 1,
  GBP: 1.17,
  NZD: 0.55,
  ZAR: 0.05,
  AUD: 0.61
};

// Country to currency mapping
export const COUNTRY_CURRENCY: Record<string, Currency> = {
  'Ireland': 'EUR',
  'Wales': 'GBP',
  'Scotland': 'GBP',
  'Italy': 'EUR',
  'England': 'GBP',
  'France': 'EUR',
  'New Zealand': 'NZD',
  'South Africa': 'ZAR',
  'Australia': 'AUD'
};

// League to currency mapping
export const LEAGUE_CURRENCY: Record<string, Currency> = {
  'URC': 'EUR',
  'Premiership': 'GBP',
  'Top 14': 'EUR',
  'Super Rugby': 'NZD'
};

// Contract interface
export interface Contract {
  playerId: string;
  teamId: string;
  salary: number; // Annual salary in local currency
  currency: Currency;
  signingBonus: number;
  performanceBonus: number; // Per match/try bonus
  startDate: { month: number; year: number };
  endDate: { month: number; year: number };
  yearsRemaining: number;
  isMarquee: boolean; // For English Premiership
}

// Transfer window configuration
export interface TransferWindow {
  isOpen: boolean;
  startMonth: number; // 6 for June (Northern), 12 for December (Southern)
  endMonth: number; // 8 for August (Northern), 2 for February (Southern)
  hemisphere: 'Northern' | 'Southern';
}

// Salary cap rules by league
export interface SalaryCapRules {
  hasCap: boolean;
  capAmount: number; // In local currency
  currency: Currency;
  under21Exempt: boolean; // France
  marqueeSlots: number; // England = 2
}

export const SALARY_CAP_RULES: Record<string, SalaryCapRules> = {
  'Premiership': {
    hasCap: true,
    capAmount: 6400000, // £6.4m
    currency: 'GBP',
    under21Exempt: false,
    marqueeSlots: 2
  },
  'Top 14': {
    hasCap: true,
    capAmount: 10700000, // €10.7m
    currency: 'EUR',
    under21Exempt: true,
    marqueeSlots: 0
  },
  'URC': {
    hasCap: false,
    capAmount: 0,
    currency: 'EUR',
    under21Exempt: false,
    marqueeSlots: 0
  },
  'Super Rugby': {
    hasCap: false,
    capAmount: 0,
    currency: 'NZD',
    under21Exempt: false,
    marqueeSlots: 0
  }
};

// Transfer offer types
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'negotiating' | 'withdrawn';

export interface TransferOffer {
  id: string;
  playerId: string;
  fromTeamId: string;
  toTeamId: string;
  offeredSalary: number;
  offeredCurrency: Currency;
  offeredBonus: number;
  contractYears: number;
  isMarquee: boolean;
  // Non-financial factors
  playingTimePromise: 'starter' | 'rotation' | 'backup' | 'development';
  styleOfPlay: string; // e.g., "expansive attacking rugby"
  lifestyleFactors: string[]; // e.g., ["city living", "family friendly", "good weather"]
  projectDescription: string; // Sell the vision
  status: OfferStatus;
  playerInterest: number; // 0-100 how interested player is
  createdAt: Date;
  respondedAt?: Date;
}

// Shortlisted player entry
export interface ShortlistedPlayer {
  playerId: string;
  teamId: string;
  addedAt: Date;
  notes: string;
  priority: 'high' | 'medium' | 'low';
  scoutingLevel: number; // 0-100, higher = more info revealed
}

// Player with contract for display
export interface PlayerWithContract extends Player {
  contract: Contract;
  currentTeamId: string;
  currentTeamName: string;
  currentLeague: string;
}

// Transfer state
export interface TransferState {
  shortlist: ShortlistedPlayer[];
  outgoingOffers: TransferOffer[];
  incomingOffers: TransferOffer[];
  transferHistory: TransferOffer[];
}

// Lifestyle factors available
export const LIFESTYLE_FACTORS = [
  'City living',
  'Coastal location',
  'Good weather',
  'Family friendly',
  'Strong expat community',
  'Low cost of living',
  'High quality of life',
  'Excellent training facilities',
  'Strong medical support',
  'International airport nearby',
  'Good schools',
  'Cultural attractions'
];

// Style of play descriptions
export const PLAY_STYLES = [
  'Expansive attacking rugby',
  'Structured phase play',
  'Direct power game',
  'High-tempo counter-attack',
  'Territory-focused kicking game',
  'Set-piece dominated',
  'High ball-in-play time',
  'Defensive excellence'
];

// Max squad size
export const MAX_SQUAD_SIZE = 45;
