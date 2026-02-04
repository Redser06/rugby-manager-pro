import { Fixture, WeatherEvent, TravelInfo, WeatherCondition, SeasonSchedule } from '@/types/fixture';
import { Team, League } from '@/types/game';
import { getTeamLocation, getWeatherProfile, TEAM_LOCATIONS } from '@/data/teamLocations';

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate travel info between two teams
export function calculateTravelInfo(homeTeamId: string, awayTeamId: string): TravelInfo {
  const homeLocation = getTeamLocation(homeTeamId);
  const awayLocation = getTeamLocation(awayTeamId);
  
  // Default values if locations not found
  if (!homeLocation || !awayLocation) {
    return {
      distance: 200,
      travelTime: 3,
      requiresOvernight: false,
      departureDayOffset: 0,
      trainingRestriction: false,
    };
  }
  
  const distance = calculateDistance(
    homeLocation.latitude, homeLocation.longitude,
    awayLocation.latitude, awayLocation.longitude
  );
  
  // Estimate travel time based on distance
  // < 200km: ~2-3 hours (same day travel)
  // 200-500km: ~4-6 hours (possible same day, but tight)
  // 500-1000km: ~6-10 hours or short flight (overnight recommended)
  // > 1000km: flight required (definitely overnight)
  // Different hemispheres: long haul flight (multiple days)
  
  let travelTime: number;
  let requiresOvernight: boolean;
  let departureDayOffset: number;
  let trainingRestriction: boolean;
  
  const differentHemisphere = homeLocation.hemisphere !== awayLocation.hemisphere;
  
  if (differentHemisphere) {
    // Long haul travel
    travelTime = 24 + (distance / 800); // Base 24h + flight time
    requiresOvernight = true;
    departureDayOffset = 3; // Leave 3 days before
    trainingRestriction = true;
  } else if (distance > 1000) {
    // Long distance, same hemisphere
    travelTime = 8 + (distance / 500);
    requiresOvernight = true;
    departureDayOffset = 1;
    trainingRestriction = true;
  } else if (distance > 500) {
    // Medium-long distance
    travelTime = 5 + (distance / 200);
    requiresOvernight = true;
    departureDayOffset = 1;
    trainingRestriction = true;
  } else if (distance > 200) {
    // Medium distance
    travelTime = 3 + (distance / 150);
    requiresOvernight = distance > 350;
    departureDayOffset = distance > 350 ? 1 : 0;
    trainingRestriction = distance > 300;
  } else {
    // Short distance
    travelTime = 1 + (distance / 100);
    requiresOvernight = false;
    departureDayOffset = 0;
    trainingRestriction = false;
  }
  
  return {
    distance: Math.round(distance),
    travelTime: Math.round(travelTime * 10) / 10,
    requiresOvernight,
    departureDayOffset,
    trainingRestriction,
  };
}

// Generate weather for a fixture based on week and location
export function generateWeather(week: number, country: string, hemisphere: 'northern' | 'southern'): WeatherEvent {
  const profile = getWeatherProfile(country);
  
  // Determine season based on hemisphere and week
  // Assuming season starts in September for NH, March for SH
  // Weeks 1-13: Autumn/Spring, 14-26: Winter/Summer
  const isWinter = hemisphere === 'northern' 
    ? (week >= 14 && week <= 22) 
    : (week >= 1 && week <= 10);
  
  const isAutumn = hemisphere === 'northern'
    ? (week >= 1 && week <= 13)
    : (week >= 23 && week <= 30);
  
  const roll = Math.random();
  
  let condition: WeatherCondition = 'clear';
  let severity: 'minor' | 'moderate' | 'severe' = 'minor';
  let affectsMatch = false;
  let description = 'Good playing conditions';
  
  if (isWinter) {
    if (roll < profile.winterStormChance * 0.3) {
      // Severe winter weather - potential postponement
      const severeRoll = Math.random();
      if (severeRoll < 0.4) {
        condition = 'storm';
        severity = 'severe';
        affectsMatch = true;
        description = 'Severe storm warning - match in doubt';
      } else if (severeRoll < 0.7) {
        condition = 'frozen_pitch';
        severity = 'severe';
        affectsMatch = true;
        description = 'Frozen pitch - match postponed';
      } else {
        condition = 'snow';
        severity = 'severe';
        affectsMatch = true;
        description = 'Heavy snow - match under review';
      }
    } else if (roll < profile.winterStormChance) {
      condition = 'heavy_rain';
      severity = 'moderate';
      affectsMatch = false;
      description = 'Heavy rain expected - difficult conditions';
    } else if (roll < profile.winterStormChance + 0.3) {
      condition = 'light_rain';
      severity = 'minor';
      description = 'Light rain - slippery conditions';
    } else if (roll < profile.winterStormChance + 0.5) {
      condition = 'fog';
      severity = 'minor';
      description = 'Foggy conditions';
    } else {
      condition = 'cloudy';
      description = 'Overcast but dry';
    }
  } else if (isAutumn) {
    if (roll < profile.autumnRainChance * 0.2) {
      condition = 'storm';
      severity = 'moderate';
      affectsMatch = Math.random() < 0.3; // 30% chance of postponement
      description = affectsMatch ? 'Storm warning - match at risk' : 'Stormy conditions expected';
    } else if (roll < profile.autumnRainChance) {
      condition = 'heavy_rain';
      severity = 'minor';
      description = 'Wet conditions expected';
    } else if (roll < profile.autumnRainChance + 0.2) {
      condition = 'light_rain';
      severity = 'minor';
      description = 'Light showers possible';
    } else {
      condition = Math.random() > 0.5 ? 'clear' : 'cloudy';
      description = condition === 'clear' ? 'Good conditions' : 'Overcast';
    }
  } else {
    // Spring/Summer
    if (roll < 1 - profile.summerClearChance) {
      condition = Math.random() > 0.5 ? 'light_rain' : 'cloudy';
      description = 'Mixed conditions';
    } else {
      condition = 'clear';
      description = 'Excellent playing conditions';
    }
  }
  
  return { condition, severity, affectsMatch, description };
}

// Generate a round-robin fixture schedule
export function generateSeasonFixtures(league: League, seasonNumber: number): SeasonSchedule {
  const teams = league.teams;
  const n = teams.length;
  
  // For round-robin, we need n-1 rounds (or n if odd number, with bye weeks)
  const hasOddTeams = n % 2 !== 0;
  const rounds = hasOddTeams ? n : n - 1;
  
  // Create team indices for rotation
  const teamIndices = teams.map((_, i) => i);
  if (hasOddTeams) {
    teamIndices.push(-1); // -1 represents bye
  }
  
  const fixtures: Fixture[] = [];
  let fixtureId = 0;
  
  // Generate first leg fixtures
  for (let round = 0; round < rounds; round++) {
    const week = round + 1;
    const pairCount = teamIndices.length / 2;
    
    for (let i = 0; i < pairCount; i++) {
      const home = teamIndices[i];
      const away = teamIndices[teamIndices.length - 1 - i];
      
      // Skip bye weeks
      if (home === -1 || away === -1) continue;
      
      const homeTeam = teams[home];
      const awayTeam = teams[away];
      
      // Alternate home/away for fairness
      const shouldSwap = round % 2 === 1 && i === 0;
      const actualHome = shouldSwap ? awayTeam : homeTeam;
      const actualAway = shouldSwap ? homeTeam : awayTeam;
      
      const homeLocation = getTeamLocation(actualHome.id);
      const weather = generateWeather(
        week, 
        homeLocation?.country || 'England',
        homeLocation?.hemisphere || 'northern'
      );
      
      const travel = calculateTravelInfo(actualHome.id, actualAway.id);
      
      fixtures.push({
        id: `fixture-${seasonNumber}-${fixtureId++}`,
        week,
        homeTeamId: actualHome.id,
        awayTeamId: actualAway.id,
        homeTeamName: actualHome.name,
        awayTeamName: actualAway.name,
        venue: actualHome.homeGround,
        status: weather.affectsMatch ? 'postponed' : 'scheduled',
        weather,
        travel,
        postponementReason: weather.affectsMatch ? weather.description : undefined,
      });
    }
    
    // Rotate teams (keep first team fixed for round-robin)
    const last = teamIndices.pop()!;
    teamIndices.splice(1, 0, last);
  }
  
  // Generate return leg fixtures (home and away swapped)
  const firstLegFixtures = [...fixtures];
  for (const fixture of firstLegFixtures) {
    const returnWeek = fixture.week + rounds + 2; // Gap between legs
    
    const homeLocation = getTeamLocation(fixture.awayTeamId);
    const weather = generateWeather(
      returnWeek,
      homeLocation?.country || 'England',
      homeLocation?.hemisphere || 'northern'
    );
    
    const travel = calculateTravelInfo(fixture.awayTeamId, fixture.homeTeamId);
    
    fixtures.push({
      id: `fixture-${seasonNumber}-${fixtureId++}`,
      week: returnWeek,
      homeTeamId: fixture.awayTeamId,
      awayTeamId: fixture.homeTeamId,
      homeTeamName: fixture.awayTeamName,
      awayTeamName: fixture.homeTeamName,
      venue: teams.find(t => t.id === fixture.awayTeamId)?.homeGround || '',
      status: weather.affectsMatch ? 'postponed' : 'scheduled',
      weather,
      travel,
      postponementReason: weather.affectsMatch ? weather.description : undefined,
    });
  }
  
  // Sort by week
  fixtures.sort((a, b) => a.week - b.week);
  
  return {
    seasonNumber,
    leagueId: league.id,
    fixtures,
    currentWeek: 1,
    totalWeeks: Math.max(...fixtures.map(f => f.week)) + 2, // Buffer for rescheduled
  };
}

// Find next available week for rescheduling
export function findRescheduleWeek(
  schedule: SeasonSchedule,
  homeTeamId: string,
  awayTeamId: string,
  fromWeek: number
): number {
  const maxWeek = schedule.totalWeeks + 4; // Allow extending season slightly
  
  for (let week = fromWeek + 1; week <= maxWeek; week++) {
    // Check if either team has a fixture that week
    const hasConflict = schedule.fixtures.some(f => 
      f.week === week && 
      f.status !== 'postponed' &&
      (f.homeTeamId === homeTeamId || f.awayTeamId === homeTeamId ||
       f.homeTeamId === awayTeamId || f.awayTeamId === awayTeamId)
    );
    
    if (!hasConflict) return week;
  }
  
  return fromWeek + 2; // Fallback
}

// Get fixtures for a specific team
export function getTeamFixtures(schedule: SeasonSchedule, teamId: string): Fixture[] {
  return schedule.fixtures.filter(f => 
    f.homeTeamId === teamId || f.awayTeamId === teamId
  );
}

// Get fixtures for a specific week
export function getWeekFixtures(schedule: SeasonSchedule, week: number): Fixture[] {
  return schedule.fixtures.filter(f => f.week === week);
}

// Check if team can train on a given day (considering travel)
export function canTeamTrain(schedule: SeasonSchedule, teamId: string, week: number): boolean {
  // Find fixtures this week where team is away
  const awayFixtures = schedule.fixtures.filter(f => 
    f.week === week && 
    f.awayTeamId === teamId &&
    f.status === 'scheduled'
  );
  
  // If any away fixture requires overnight travel, training is restricted
  return !awayFixtures.some(f => f.travel?.trainingRestriction);
}
