import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  TransferState, 
  ShortlistedPlayer, 
  TransferOffer, 
  Contract,
  SALARY_CAP_RULES,
  MAX_SQUAD_SIZE,
  PlayerWithContract,
  OfferStatus
} from '@/types/transfer';
import { Player, Team } from '@/types/game';
import { useGame } from './GameContext';
import { generateContract, estimatePlayerValue } from '@/utils/contractGenerator';
import { LEAGUES } from '@/data/leagues';

interface TransferContextType {
  transferState: TransferState;
  contracts: Record<string, Contract>;
  
  // Transfer window
  isTransferWindowOpen: () => boolean;
  getTransferWindowDates: () => { start: string; end: string };
  
  // Shortlist management
  addToShortlist: (playerId: string, teamId: string, notes?: string) => void;
  removeFromShortlist: (playerId: string) => void;
  updateShortlistNotes: (playerId: string, notes: string) => void;
  updateShortlistPriority: (playerId: string, priority: 'high' | 'medium' | 'low') => void;
  isOnShortlist: (playerId: string) => boolean;
  
  // Offers
  createOffer: (offer: Omit<TransferOffer, 'id' | 'createdAt' | 'status' | 'playerInterest'>) => void;
  withdrawOffer: (offerId: string) => void;
  respondToOffer: (offerId: string, accept: boolean) => void;
  
  // Salary cap
  getTeamSalaryCap: (teamId: string) => { current: number; max: number; remaining: number; currency: string } | null;
  getTeamSquadSize: (teamId: string) => number;
  canSignPlayer: (playerId: string, proposedSalary: number) => { canSign: boolean; reason?: string };
  
  // Player queries
  getExpiringContracts: () => PlayerWithContract[];
  getAllAvailablePlayers: () => PlayerWithContract[];
  getPlayerContract: (playerId: string) => Contract | null;
  getMyTeamPlayersWithContracts: () => PlayerWithContract[];
  
  // Contract updates
  setPlayerAsMarquee: (playerId: string, isMarquee: boolean) => void;
  releasePlayer: (playerId: string) => void;
  extendContract: (playerId: string, newSalary: number, years: number) => void;
}

const TransferContext = createContext<TransferContextType | undefined>(undefined);

const INITIAL_TRANSFER_STATE: TransferState = {
  shortlist: [],
  outgoingOffers: [],
  incomingOffers: [],
  transferHistory: []
};

// Helper to safely get/set localStorage with size checking
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      // Quota exceeded - clear this key and try again
      console.warn(`localStorage quota exceeded for ${key}, clearing...`);
      try {
        localStorage.removeItem(key);
        localStorage.setItem(key, value);
        return true;
      } catch {
        console.error(`Failed to save ${key} to localStorage`);
        return false;
      }
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }
};

// Compress contract data to only essential fields for storage
const compressContract = (contract: Contract) => ({
  s: contract.salary, // salary
  y: contract.yearsRemaining, // years
  m: contract.isMarquee ? 1 : 0, // marquee flag
  c: contract.currency === 'EUR' ? 0 : contract.currency === 'GBP' ? 1 : 2, // currency enum
  t: contract.teamId, // teamId
});

const decompressContract = (compressed: { s: number; y: number; m: number; c: number; t: string }, playerId: string): Contract => ({
  playerId,
  teamId: compressed.t,
  salary: compressed.s,
  currency: compressed.c === 0 ? 'EUR' : compressed.c === 1 ? 'GBP' : 'ZAR',
  signingBonus: 0,
  performanceBonus: 0,
  yearsRemaining: compressed.y,
  startDate: { month: 7, year: 2024 },
  endDate: { month: 6, year: 2024 + compressed.y },
  isMarquee: compressed.m === 1
});

export function TransferProvider({ children }: { children: ReactNode }) {
  const { gameState, getMyTeam, getMyLeague } = useGame();
  
  const [transferState, setTransferState] = useState<TransferState>(() => {
    const saved = safeLocalStorage.getItem('rugbyManagerTransfers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_TRANSFER_STATE;
      }
    }
    return INITIAL_TRANSFER_STATE;
  });
  
  const [contracts, setContracts] = useState<Record<string, Contract>>(() => {
    // First try compressed format
    const compressed = safeLocalStorage.getItem('rugbyManagerContractsV2');
    if (compressed) {
      try {
        const parsed = JSON.parse(compressed);
        const result: Record<string, Contract> = {};
        for (const [playerId, data] of Object.entries(parsed)) {
          result[playerId] = decompressContract(data as { s: number; y: number; m: number; c: number; t: string }, playerId);
        }
        return result;
      } catch {
        // Fall through
      }
    }
    
    // Clear old bloated format
    safeLocalStorage.removeItem('rugbyManagerContracts');
    return {};
  });
  
  // Generate contracts for all players if not exists
  useEffect(() => {
    const allPlayers: { player: Player; teamId: string; teamCountry: string; league: string }[] = [];
    
    LEAGUES.forEach(league => {
      league.teams.forEach(team => {
        team.players.forEach(player => {
          allPlayers.push({
            player,
            teamId: team.id,
            teamCountry: team.country,
            league: league.name
          });
        });
      });
    });
    
    const existingIds = new Set(Object.keys(contracts));
    const newContracts: Record<string, Contract> = { ...contracts };
    let hasNew = false;
    
    allPlayers.forEach(({ player, teamId, teamCountry, league }) => {
      if (!existingIds.has(player.id)) {
        newContracts[player.id] = generateContract(
          player,
          teamId,
          teamCountry,
          league,
          gameState.currentSeason
        );
        hasNew = true;
      }
    });
    
    if (hasNew) {
      setContracts(newContracts);
    }
  }, [gameState.leagues]);
  
  // Persist transfer state
  useEffect(() => {
    safeLocalStorage.setItem('rugbyManagerTransfers', JSON.stringify(transferState));
  }, [transferState]);
  
  // Persist contracts in compressed format
  useEffect(() => {
    const compressed: Record<string, ReturnType<typeof compressContract>> = {};
    for (const [playerId, contract] of Object.entries(contracts)) {
      compressed[playerId] = compressContract(contract);
    }
    safeLocalStorage.setItem('rugbyManagerContractsV2', JSON.stringify(compressed));
  }, [contracts]);
  
  const isTransferWindowOpen = (): boolean => {
    const myTeam = getMyTeam();
    if (!myTeam) return false;
    
    // Determine hemisphere based on league
    const myLeague = getMyLeague();
    const isSouthern = myLeague?.name === 'Super Rugby';
    
    // Current month (simulated based on week)
    const currentMonth = Math.floor((gameState.currentWeek - 1) / 4) + 1; // Rough approximation
    
    if (isSouthern) {
      // Dec-Feb for Southern
      return currentMonth === 12 || currentMonth <= 2;
    } else {
      // June-Aug for Northern
      return currentMonth >= 6 && currentMonth <= 8;
    }
  };
  
  const getTransferWindowDates = () => {
    const myLeague = getMyLeague();
    const isSouthern = myLeague?.name === 'Super Rugby';
    
    if (isSouthern) {
      return { start: 'December 1', end: 'February 28' };
    }
    return { start: 'June 1', end: 'August 31' };
  };
  
  const addToShortlist = (playerId: string, teamId: string, notes: string = '') => {
    if (transferState.shortlist.some(s => s.playerId === playerId)) return;
    
    setTransferState(prev => ({
      ...prev,
      shortlist: [...prev.shortlist, {
        playerId,
        teamId,
        addedAt: new Date(),
        notes,
        priority: 'medium',
        scoutingLevel: 50
      }]
    }));
  };
  
  const removeFromShortlist = (playerId: string) => {
    setTransferState(prev => ({
      ...prev,
      shortlist: prev.shortlist.filter(s => s.playerId !== playerId)
    }));
  };
  
  const updateShortlistNotes = (playerId: string, notes: string) => {
    setTransferState(prev => ({
      ...prev,
      shortlist: prev.shortlist.map(s => 
        s.playerId === playerId ? { ...s, notes } : s
      )
    }));
  };
  
  const updateShortlistPriority = (playerId: string, priority: 'high' | 'medium' | 'low') => {
    setTransferState(prev => ({
      ...prev,
      shortlist: prev.shortlist.map(s => 
        s.playerId === playerId ? { ...s, priority } : s
      )
    }));
  };
  
  const isOnShortlist = (playerId: string): boolean => {
    return transferState.shortlist.some(s => s.playerId === playerId);
  };
  
  const createOffer = (offer: Omit<TransferOffer, 'id' | 'createdAt' | 'status' | 'playerInterest'>) => {
    const player = findPlayerById(offer.playerId);
    if (!player) return;
    
    // Calculate player interest based on offer quality
    const contract = contracts[offer.playerId];
    const salaryIncrease = contract ? (offer.offeredSalary - contract.salary) / contract.salary : 0;
    
    let interest = 50; // Base interest
    
    // Salary factors
    if (salaryIncrease > 0.5) interest += 20;
    else if (salaryIncrease > 0.2) interest += 10;
    else if (salaryIncrease < 0) interest -= 20;
    
    // Playing time
    if (offer.playingTimePromise === 'starter') interest += 15;
    else if (offer.playingTimePromise === 'rotation') interest += 5;
    else if (offer.playingTimePromise === 'backup') interest -= 10;
    
    // Contract length
    if (offer.contractYears >= 3) interest += 5;
    
    // Add some randomness
    interest += Math.floor(Math.random() * 20) - 10;
    interest = Math.max(0, Math.min(100, interest));
    
    const newOffer: TransferOffer = {
      ...offer,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date(),
      status: 'pending',
      playerInterest: interest
    };
    
    setTransferState(prev => ({
      ...prev,
      outgoingOffers: [...prev.outgoingOffers, newOffer]
    }));
  };
  
  const withdrawOffer = (offerId: string) => {
    setTransferState(prev => ({
      ...prev,
      outgoingOffers: prev.outgoingOffers.map(o => 
        o.id === offerId ? { ...o, status: 'withdrawn' as OfferStatus } : o
      )
    }));
  };
  
  const respondToOffer = (offerId: string, accept: boolean) => {
    setTransferState(prev => ({
      ...prev,
      incomingOffers: prev.incomingOffers.map(o => 
        o.id === offerId ? { 
          ...o, 
          status: accept ? 'accepted' as OfferStatus : 'rejected' as OfferStatus,
          respondedAt: new Date()
        } : o
      )
    }));
  };
  
  const getTeamSalaryCap = (teamId: string) => {
    const team = findTeamById(teamId);
    if (!team) return null;
    
    const league = LEAGUES.find(l => l.teams.some(t => t.id === teamId));
    if (!league) return null;
    
    const rules = SALARY_CAP_RULES[league.name];
    if (!rules || !rules.hasCap) return null;
    
    // Calculate current spend
    let currentSpend = 0;
    let marqueeCount = 0;
    
    team.players.forEach(player => {
      const contract = contracts[player.id];
      if (contract) {
        if (contract.isMarquee && rules.marqueeSlots > 0) {
          marqueeCount++;
          if (marqueeCount <= rules.marqueeSlots) {
            return; // Skip marquee players from cap
          }
        }
        
        if (rules.under21Exempt && player.age < 21) {
          return; // Skip U21 in France
        }
        
        currentSpend += contract.salary;
      }
    });
    
    return {
      current: currentSpend,
      max: rules.capAmount,
      remaining: rules.capAmount - currentSpend,
      currency: rules.currency
    };
  };
  
  const getTeamSquadSize = (teamId: string): number => {
    const team = findTeamById(teamId);
    return team?.players.length || 0;
  };
  
  const canSignPlayer = (playerId: string, proposedSalary: number) => {
    const myTeam = getMyTeam();
    if (!myTeam) return { canSign: false, reason: 'No team selected' };
    
    // Check squad size
    if (myTeam.players.length >= MAX_SQUAD_SIZE) {
      return { canSign: false, reason: `Squad is at maximum size (${MAX_SQUAD_SIZE} players)` };
    }
    
    // Check salary cap
    const cap = getTeamSalaryCap(myTeam.id);
    if (cap && proposedSalary > cap.remaining) {
      return { 
        canSign: false, 
        reason: `Exceeds salary cap. Remaining: ${cap.currency}${cap.remaining.toLocaleString()}` 
      };
    }
    
    return { canSign: true };
  };
  
  const getExpiringContracts = (): PlayerWithContract[] => {
    const result: PlayerWithContract[] = [];
    
    LEAGUES.forEach(league => {
      league.teams.forEach(team => {
        team.players.forEach(player => {
          const contract = contracts[player.id];
          if (contract && contract.yearsRemaining === 0) {
            result.push({
              ...player,
              contract,
              currentTeamId: team.id,
              currentTeamName: team.name,
              currentLeague: league.name
            });
          }
        });
      });
    });
    
    return result;
  };
  
  const getAllAvailablePlayers = (): PlayerWithContract[] => {
    const myTeam = getMyTeam();
    const result: PlayerWithContract[] = [];
    
    LEAGUES.forEach(league => {
      league.teams.forEach(team => {
        // Exclude own team
        if (team.id === myTeam?.id) return;
        
        team.players.forEach(player => {
          const contract = contracts[player.id];
          if (contract) {
            result.push({
              ...player,
              contract,
              currentTeamId: team.id,
              currentTeamName: team.name,
              currentLeague: league.name
            });
          }
        });
      });
    });
    
    return result;
  };
  
  const getPlayerContract = (playerId: string): Contract | null => {
    return contracts[playerId] || null;
  };
  
  const setPlayerAsMarquee = (playerId: string, isMarquee: boolean) => {
    setContracts(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        isMarquee
      }
    }));
  };
  
  const getMyTeamPlayersWithContracts = (): PlayerWithContract[] => {
    const myTeam = getMyTeam();
    const myLeague = getMyLeague();
    if (!myTeam || !myLeague) return [];
    
    return myTeam.players.map(player => {
      const contract = contracts[player.id];
      return {
        ...player,
        contract: contract || generateContract(player, myTeam.id, myTeam.country, myLeague.name, gameState.currentSeason),
        currentTeamId: myTeam.id,
        currentTeamName: myTeam.name,
        currentLeague: myLeague.name
      };
    });
  };
  
  const releasePlayer = (playerId: string) => {
    // Remove contract
    setContracts(prev => {
      const newContracts = { ...prev };
      delete newContracts[playerId];
      return newContracts;
    });
    
    // Add to transfer state history
    setTransferState(prev => ({
      ...prev,
      transferHistory: [...prev.transferHistory, {
        id: Math.random().toString(36).substring(2, 9),
        playerId,
        fromTeamId: getMyTeam()?.id || '',
        toTeamId: '',
        offeredSalary: 0,
        offeredCurrency: 'EUR',
        offeredBonus: 0,
        contractYears: 0,
        isMarquee: false,
        playingTimePromise: 'starter',
        styleOfPlay: '',
        lifestyleFactors: [],
        projectDescription: 'Released',
        status: 'accepted',
        playerInterest: 0,
        createdAt: new Date()
      }]
    }));
  };
  
  const extendContract = (playerId: string, newSalary: number, years: number) => {
    const currentContract = contracts[playerId];
    if (!currentContract) return;
    
    const currentYear = 2024 + gameState.currentSeason - 1;
    
    setContracts(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        salary: newSalary,
        yearsRemaining: years,
        startDate: { month: 7, year: currentYear },
        endDate: { month: 6, year: currentYear + years }
      }
    }));
  };
  
  // Helper functions
  const findPlayerById = (playerId: string): Player | null => {
    for (const league of LEAGUES) {
      for (const team of league.teams) {
        const player = team.players.find(p => p.id === playerId);
        if (player) return player;
      }
    }
    return null;
  };
  
  const findTeamById = (teamId: string): Team | null => {
    for (const league of LEAGUES) {
      const team = league.teams.find(t => t.id === teamId);
      if (team) return team;
    }
    return null;
  };
  
  return (
    <TransferContext.Provider value={{
      transferState,
      contracts,
      isTransferWindowOpen,
      getTransferWindowDates,
      addToShortlist,
      removeFromShortlist,
      updateShortlistNotes,
      updateShortlistPriority,
      isOnShortlist,
      createOffer,
      withdrawOffer,
      respondToOffer,
      getTeamSalaryCap,
      getTeamSquadSize,
      canSignPlayer,
      getExpiringContracts,
      getAllAvailablePlayers,
      getPlayerContract,
      getMyTeamPlayersWithContracts,
      setPlayerAsMarquee,
      releasePlayer,
      extendContract
    }}>
      {children}
    </TransferContext.Provider>
  );
}

export function useTransfer() {
  const context = useContext(TransferContext);
  if (!context) {
    throw new Error('useTransfer must be used within a TransferProvider');
  }
  return context;
}
