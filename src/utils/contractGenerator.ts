import { Player } from '@/types/game';
import { Contract, Currency, COUNTRY_CURRENCY, LEAGUE_CURRENCY, EXCHANGE_RATES } from '@/types/transfer';

// Salary ranges in EUR (will be converted to local currency)
const SALARY_RANGES_EUR = {
  elite: { min: 400000, max: 600000 },      // 90+ overall
  star: { min: 250000, max: 400000 },       // 80-89 overall
  established: { min: 120000, max: 250000 }, // 70-79 overall
  squad: { min: 60000, max: 120000 },       // 60-69 overall
  academy: { min: 30000, max: 60000 }       // <60 overall
};

function getSalaryTier(overall: number): keyof typeof SALARY_RANGES_EUR {
  if (overall >= 90) return 'elite';
  if (overall >= 80) return 'star';
  if (overall >= 70) return 'established';
  if (overall >= 60) return 'squad';
  return 'academy';
}

function convertToLocalCurrency(eurAmount: number, currency: Currency): number {
  const rate = EXCHANGE_RATES[currency];
  return Math.round(eurAmount / rate);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateContract(
  player: Player,
  teamId: string,
  teamCountry: string,
  league: string,
  currentSeason: number = 1
): Contract {
  const currency = LEAGUE_CURRENCY[league] || COUNTRY_CURRENCY[teamCountry] || 'EUR';
  const tier = getSalaryTier(player.overall);
  const range = SALARY_RANGES_EUR[tier];
  
  // Base salary in EUR
  let baseSalaryEur = randomBetween(range.min, range.max);
  
  // Age modifiers
  if (player.age <= 22) {
    // Young players earn less but have longer contracts
    baseSalaryEur = Math.round(baseSalaryEur * 0.6);
  } else if (player.age <= 25) {
    baseSalaryEur = Math.round(baseSalaryEur * 0.85);
  } else if (player.age >= 32) {
    // Older players might earn more short-term
    baseSalaryEur = Math.round(baseSalaryEur * 1.1);
  }
  
  // Convert to local currency
  const salary = convertToLocalCurrency(baseSalaryEur, currency);
  
  // Signing bonus (10-20% of salary for good players)
  const signingBonus = player.overall >= 75 
    ? Math.round(salary * (randomBetween(10, 20) / 100))
    : 0;
  
  // Performance bonus (2-5% per match)
  const performanceBonus = Math.round(salary * (randomBetween(2, 5) / 100) / 25); // Per match approx
  
  // Contract length based on age
  let contractLength: number;
  if (player.age <= 23) {
    contractLength = randomBetween(3, 5);
  } else if (player.age <= 28) {
    contractLength = randomBetween(2, 4);
  } else if (player.age <= 31) {
    contractLength = randomBetween(1, 3);
  } else {
    contractLength = randomBetween(1, 2);
  }
  
  // Randomize years remaining (simulate mid-contract players)
  const yearsRemaining = randomBetween(0, contractLength);
  
  // Calculate start/end dates
  const currentYear = 2024 + currentSeason - 1;
  const startYear = currentYear - (contractLength - yearsRemaining);
  const endYear = startYear + contractLength;
  
  return {
    playerId: player.id,
    teamId,
    salary,
    currency,
    signingBonus,
    performanceBonus,
    startDate: { month: 7, year: startYear }, // July (start of season)
    endDate: { month: 6, year: endYear }, // June (end of season)
    yearsRemaining,
    isMarquee: false
  };
}

export function estimatePlayerValue(player: Player): number {
  // Returns estimated value in EUR
  const tier = getSalaryTier(player.overall);
  const range = SALARY_RANGES_EUR[tier];
  let value = (range.min + range.max) / 2;
  
  // Age value curve (peak at 26-28)
  if (player.age <= 22) {
    value *= 1.3; // High potential
  } else if (player.age <= 25) {
    value *= 1.2;
  } else if (player.age <= 28) {
    value *= 1.0;
  } else if (player.age <= 31) {
    value *= 0.8;
  } else {
    value *= 0.5;
  }
  
  return Math.round(value);
}

export function formatSalary(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    EUR: '€',
    GBP: '£',
    NZD: 'NZ$',
    ZAR: 'R',
    AUD: 'A$'
  };
  
  if (amount >= 1000000) {
    return `${symbols[currency]}${(amount / 1000000).toFixed(2)}m`;
  } else if (amount >= 1000) {
    return `${symbols[currency]}${(amount / 1000).toFixed(0)}k`;
  }
  return `${symbols[currency]}${amount}`;
}

export function getContractStatus(yearsRemaining: number): 'expiring' | 'short' | 'medium' | 'long' {
  if (yearsRemaining === 0) return 'expiring';
  if (yearsRemaining === 1) return 'short';
  if (yearsRemaining <= 3) return 'medium';
  return 'long';
}

export function isPlayerContractExpiring(contract: Contract): boolean {
  return contract.yearsRemaining === 0;
}
