import { TeamLocation, WeatherProfile } from '@/types/fixture';

// Team locations for travel calculations
export const TEAM_LOCATIONS: TeamLocation[] = [
  // Ireland
  { teamId: 'leinster', city: 'Dublin', country: 'Ireland', latitude: 53.3498, longitude: -6.2603, timezone: 'Europe/Dublin', hemisphere: 'northern' },
  { teamId: 'munster', city: 'Limerick', country: 'Ireland', latitude: 52.6638, longitude: -8.6267, timezone: 'Europe/Dublin', hemisphere: 'northern' },
  { teamId: 'ulster', city: 'Belfast', country: 'Northern Ireland', latitude: 54.5973, longitude: -5.9301, timezone: 'Europe/Dublin', hemisphere: 'northern' },
  { teamId: 'connacht', city: 'Galway', country: 'Ireland', latitude: 53.2707, longitude: -9.0568, timezone: 'Europe/Dublin', hemisphere: 'northern' },
  
  // Wales
  { teamId: 'cardiff', city: 'Cardiff', country: 'Wales', latitude: 51.4816, longitude: -3.1791, timezone: 'Europe/London', hemisphere: 'northern' },
  { teamId: 'scarlets', city: 'Llanelli', country: 'Wales', latitude: 51.6802, longitude: -4.1591, timezone: 'Europe/London', hemisphere: 'northern' },
  { teamId: 'ospreys', city: 'Swansea', country: 'Wales', latitude: 51.6214, longitude: -3.9436, timezone: 'Europe/London', hemisphere: 'northern' },
  { teamId: 'dragons', city: 'Newport', country: 'Wales', latitude: 51.5842, longitude: -2.9977, timezone: 'Europe/London', hemisphere: 'northern' },
  
  // Scotland
  { teamId: 'edinburgh', city: 'Edinburgh', country: 'Scotland', latitude: 55.9533, longitude: -3.1883, timezone: 'Europe/London', hemisphere: 'northern' },
  { teamId: 'glasgow', city: 'Glasgow', country: 'Scotland', latitude: 55.8642, longitude: -4.2518, timezone: 'Europe/London', hemisphere: 'northern' },
  
  // Italy
  { teamId: 'benetton', city: 'Treviso', country: 'Italy', latitude: 45.6669, longitude: 12.2430, timezone: 'Europe/Rome', hemisphere: 'northern' },
  { teamId: 'zebre', city: 'Parma', country: 'Italy', latitude: 44.8015, longitude: 10.3279, timezone: 'Europe/Rome', hemisphere: 'northern' },
  
  // England (Premiership)
  { teamId: 'bath', city: 'Bath', country: 'England', latitude: 51.3758, longitude: -2.3599, timezone: 'Europe/London', hemisphere: 'northern' },
  { teamId: 'bristol', city: 'Bristol', country: 'England', latitude: 51.4545, longitude: -2.5879, timezone: 'Europe/London', hemisphere: 'northern' },
  { teamId: 'exeter', city: 'Exeter', country: 'England', latitude: 50.7184, longitude: -3.5339, timezone: 'Europe/London', hemisphere: 'northern' },
  { teamId: 'gloucester', city: 'Gloucester', country: 'England', latitude: 51.8642, longitude: -2.2382, timezone: 'Europe/London', hemisphere: 'northern' },
  { teamId: 'harlequins', city: 'London', country: 'England', latitude: 51.4652, longitude: -0.3152, timezone: 'Europe/London', hemisphere: 'northern' },
  { teamId: 'leicester', city: 'Leicester', country: 'England', latitude: 52.6369, longitude: -1.1398, timezone: 'Europe/London', hemisphere: 'northern' },
  { teamId: 'northampton', city: 'Northampton', country: 'England', latitude: 52.2405, longitude: -0.9027, timezone: 'Europe/London', hemisphere: 'northern' },
  { teamId: 'sale', city: 'Manchester', country: 'England', latitude: 53.4631, longitude: -2.2913, timezone: 'Europe/London', hemisphere: 'northern' },
  { teamId: 'saracens', city: 'London', country: 'England', latitude: 51.6024, longitude: -0.2619, timezone: 'Europe/London', hemisphere: 'northern' },
  { teamId: 'newcastle', city: 'Newcastle', country: 'England', latitude: 54.9783, longitude: -1.6178, timezone: 'Europe/London', hemisphere: 'northern' },
  
  // France (Top 14)
  { teamId: 'toulouse', city: 'Toulouse', country: 'France', latitude: 43.6047, longitude: 1.4442, timezone: 'Europe/Paris', hemisphere: 'northern' },
  { teamId: 'la-rochelle', city: 'La Rochelle', country: 'France', latitude: 46.1603, longitude: -1.1511, timezone: 'Europe/Paris', hemisphere: 'northern' },
  { teamId: 'bordeaux', city: 'Bordeaux', country: 'France', latitude: 44.8378, longitude: -0.5792, timezone: 'Europe/Paris', hemisphere: 'northern' },
  { teamId: 'racing92', city: 'Paris', country: 'France', latitude: 48.8925, longitude: 2.2157, timezone: 'Europe/Paris', hemisphere: 'northern' },
  { teamId: 'clermont', city: 'Clermont-Ferrand', country: 'France', latitude: 45.7772, longitude: 3.0870, timezone: 'Europe/Paris', hemisphere: 'northern' },
  { teamId: 'lyon', city: 'Lyon', country: 'France', latitude: 45.7640, longitude: 4.8357, timezone: 'Europe/Paris', hemisphere: 'northern' },
  { teamId: 'montpellier', city: 'Montpellier', country: 'France', latitude: 43.6108, longitude: 3.8767, timezone: 'Europe/Paris', hemisphere: 'northern' },
  { teamId: 'toulon', city: 'Toulon', country: 'France', latitude: 43.1242, longitude: 5.9280, timezone: 'Europe/Paris', hemisphere: 'northern' },
  { teamId: 'stade-francais', city: 'Paris', country: 'France', latitude: 48.8308, longitude: 2.2526, timezone: 'Europe/Paris', hemisphere: 'northern' },
  { teamId: 'castres', city: 'Castres', country: 'France', latitude: 43.6060, longitude: 2.2398, timezone: 'Europe/Paris', hemisphere: 'northern' },
  
  // Southern Hemisphere
  { teamId: 'crusaders', city: 'Christchurch', country: 'New Zealand', latitude: -43.5321, longitude: 172.6362, timezone: 'Pacific/Auckland', hemisphere: 'southern' },
  { teamId: 'blues', city: 'Auckland', country: 'New Zealand', latitude: -36.8509, longitude: 174.7645, timezone: 'Pacific/Auckland', hemisphere: 'southern' },
  { teamId: 'stormers', city: 'Cape Town', country: 'South Africa', latitude: -33.9249, longitude: 18.4241, timezone: 'Africa/Johannesburg', hemisphere: 'southern' },
  { teamId: 'bulls', city: 'Pretoria', country: 'South Africa', latitude: -25.7479, longitude: 28.2293, timezone: 'Africa/Johannesburg', hemisphere: 'southern' },
  { teamId: 'brumbies', city: 'Canberra', country: 'Australia', latitude: -35.2809, longitude: 149.1300, timezone: 'Australia/Sydney', hemisphere: 'southern' },
  { teamId: 'reds', city: 'Brisbane', country: 'Australia', latitude: -27.4698, longitude: 153.0251, timezone: 'Australia/Brisbane', hemisphere: 'southern' },
];

// Weather profiles by region
export const WEATHER_PROFILES: Record<string, WeatherProfile> = {
  'Ireland': { region: 'Ireland', winterStormChance: 0.15, autumnRainChance: 0.25, springRainChance: 0.20, summerClearChance: 0.60 },
  'Wales': { region: 'Wales', winterStormChance: 0.12, autumnRainChance: 0.22, springRainChance: 0.18, summerClearChance: 0.65 },
  'Scotland': { region: 'Scotland', winterStormChance: 0.20, autumnRainChance: 0.25, springRainChance: 0.22, summerClearChance: 0.55 },
  'England': { region: 'England', winterStormChance: 0.10, autumnRainChance: 0.18, springRainChance: 0.15, summerClearChance: 0.70 },
  'France': { region: 'France', winterStormChance: 0.08, autumnRainChance: 0.15, springRainChance: 0.12, summerClearChance: 0.80 },
  'Italy': { region: 'Italy', winterStormChance: 0.05, autumnRainChance: 0.12, springRainChance: 0.10, summerClearChance: 0.85 },
  'New Zealand': { region: 'New Zealand', winterStormChance: 0.12, autumnRainChance: 0.18, springRainChance: 0.15, summerClearChance: 0.70 },
  'South Africa': { region: 'South Africa', winterStormChance: 0.05, autumnRainChance: 0.10, springRainChance: 0.12, summerClearChance: 0.85 },
  'Australia': { region: 'Australia', winterStormChance: 0.08, autumnRainChance: 0.10, springRainChance: 0.08, summerClearChance: 0.90 },
};

export function getTeamLocation(teamId: string): TeamLocation | undefined {
  // Normalize team ID for lookup
  const normalizedId = teamId.toLowerCase().replace(/\s+/g, '-');
  return TEAM_LOCATIONS.find(l => l.teamId === normalizedId || l.teamId === teamId);
}

export function getWeatherProfile(country: string): WeatherProfile {
  return WEATHER_PROFILES[country] || WEATHER_PROFILES['England'];
}
