// Ireland Squad Depth Data — exact data from the branch

export interface DepthPosition {
  id: number;
  num: string;
  name: string;
  abbr: string;
  group: 'Forwards' | 'Backs';
}

export interface DepthPlayer {
  name: string;
  pos: number;
  rating: number;
  secondary: boolean;
}

export const POSITIONS: DepthPosition[] = [
  { id: 1,  num: '1',  name: 'Loosehead Prop',   abbr: 'LHP', group: 'Forwards' },
  { id: 2,  num: '2',  name: 'Hooker',            abbr: 'HOO', group: 'Forwards' },
  { id: 3,  num: '3',  name: 'Tighthead Prop',    abbr: 'THP', group: 'Forwards' },
  { id: 4,  num: '4',  name: 'Lock (L4)',          abbr: 'L4',  group: 'Forwards' },
  { id: 5,  num: '5',  name: 'Lock (L5)',          abbr: 'L5',  group: 'Forwards' },
  { id: 6,  num: '6',  name: 'Blindside Flanker', abbr: 'BSF', group: 'Forwards' },
  { id: 7,  num: '7',  name: 'Openside Flanker',  abbr: 'OSF', group: 'Forwards' },
  { id: 8,  num: '8',  name: 'Number Eight',       abbr: 'N8',  group: 'Forwards' },
  { id: 9,  num: '9',  name: 'Scrum-Half',         abbr: 'SH',  group: 'Backs'   },
  { id: 10, num: '10', name: 'Fly-Half',           abbr: 'FH',  group: 'Backs'   },
  { id: 11, num: '11', name: 'Left Wing',          abbr: 'LW',  group: 'Backs'   },
  { id: 12, num: '12', name: 'Inside Centre',      abbr: 'IC',  group: 'Backs'   },
  { id: 13, num: '13', name: 'Outside Centre',     abbr: 'OC',  group: 'Backs'   },
  { id: 14, num: '14', name: 'Right Wing',         abbr: 'RW',  group: 'Backs'   },
  { id: 15, num: '15', name: 'Fullback',           abbr: 'FB',  group: 'Backs'   },
];

const PLAYERS_RAW = [
  // 1. Loosehead Prop
  { name: 'Andrew Porter',       pos: 1,  rating: 92 },
  { name: 'Paddy McCarthy',      pos: 1,  rating: 82 },
  { name: 'Jack Boyle',          pos: 1,  rating: 82 },
  { name: "Tom O'Toole",         pos: 1,  rating: 80 },
  { name: 'Jeremy Loughman',     pos: 1,  rating: 76 },
  { name: 'Michael Milne',       pos: 1,  rating: 60 },
  { name: 'Billy Bohan',         pos: 1,  rating: 55 },
  // 2. Hooker
  { name: 'Dan Sheehan',         pos: 2,  rating: 95 },
  { name: 'Ronan Kelleher',      pos: 2,  rating: 88 },
  { name: 'Gus McCarthy',        pos: 2,  rating: 78 },
  { name: 'Tom Stewart',         pos: 2,  rating: 60 },
  { name: 'Lee Barron *',        pos: 2,  rating: 50 },
  // 3. Tighthead Prop
  { name: 'Tadhg Furlong',       pos: 3,  rating: 88 },
  { name: 'Tom Clarkson',        pos: 3,  rating: 82 },
  { name: 'Finlay Bealham',      pos: 3,  rating: 78 },
  { name: 'Jack Aungier',        pos: 3,  rating: 62 },
  { name: 'Scott Wilson *',      pos: 3,  rating: 52 },
  // 4. Lock L4
  { name: 'Joe McCarthy',        pos: 4,  rating: 90 },
  { name: 'James Ryan',          pos: 4,  rating: 90 },
  { name: 'Edwin Edogbo',        pos: 4,  rating: 81 },
  { name: 'Iain Henderson',      pos: 4,  rating: 78 },
  // 5. Lock L5
  { name: 'Tadhg Beirne',        pos: 5,  rating: 95 },
  { name: 'Tom Ahern',           pos: 5,  rating: 78 },
  { name: 'Darragh Murray',      pos: 5,  rating: 76 },
  { name: 'Josh Murphy *',       pos: 5,  rating: 58 },
  { name: 'Diarmuid Mangan *',   pos: 5,  rating: 55 },
  // 6. Blindside Flanker
  { name: 'Ryan Baird',          pos: 6,  rating: 88 },
  { name: 'Cian Prendergast',    pos: 6,  rating: 81 },
  { name: 'Cormac Izuchukwu',    pos: 6,  rating: 80 },
  { name: 'Max Deegan',          pos: 6,  rating: 77 },
  { name: "Jack O'Donoghue",     pos: 6,  rating: 68 },
  { name: 'David McCann',        pos: 6,  rating: 65 },
  { name: 'James McNabney',      pos: 6,  rating: 55 },
  // 7. Openside Flanker
  { name: 'Josh van der Flier',  pos: 7,  rating: 92 },
  { name: 'Nick Timoney',        pos: 7,  rating: 85 },
  { name: 'Will Conners',        pos: 7,  rating: 75 },
  { name: 'Scott Penny *',       pos: 7,  rating: 70 },
  { name: 'Alex Kendellen',      pos: 7,  rating: 69 },
  { name: 'John Hodnett *',      pos: 7,  rating: 62 },
  { name: 'Bryn Ward',           pos: 7,  rating: 58 },
  // 8. Number Eight
  { name: 'Caelan Doris',        pos: 8,  rating: 98 },
  { name: 'Jack Conan',          pos: 8,  rating: 94 },
  { name: 'Gavin Coombes',       pos: 8,  rating: 69 },
  { name: 'Brian Gleeson',       pos: 8,  rating: 64 },
  // 9. Scrum-Half
  { name: 'Jamison Gibson-Park', pos: 9,  rating: 98 },
  { name: 'Craig Casey',         pos: 9,  rating: 85 },
  { name: 'Nathan Doak',         pos: 9,  rating: 74 },
  { name: 'Caolin Blade',        pos: 9,  rating: 68 },
  { name: 'Fintan Gunne',        pos: 9,  rating: 63 },
  { name: 'Ben Murphy',          pos: 9,  rating: 59 },
  // 10. Fly-Half
  { name: 'Jack Crowley',        pos: 10, rating: 85 },
  { name: 'Sam Prendergast',     pos: 10, rating: 80 },
  { name: 'Ciarán Frawley',      pos: 10, rating: 78 },
  { name: 'Harry Byrne',         pos: 10, rating: 77 },
  // 11. Left Wing
  { name: 'James Lowe',          pos: 11, rating: 86 },
  { name: 'Jacob Stockdale',     pos: 11, rating: 80 },
  { name: 'Shayne Bolton',       pos: 11, rating: 61 },
  { name: 'JJ Kenny',            pos: 11, rating: 60 },
  { name: 'Zac Ward',            pos: 11, rating: 59 },
  // 12. Inside Centre
  { name: 'Robbie Henshaw',      pos: 12, rating: 87 },
  { name: 'Stuart McCloskey',    pos: 12, rating: 87 },
  { name: 'Bundee Aki',          pos: 12, rating: 86 },
  { name: 'Charlie Tector',      pos: 12, rating: 60 },
  { name: 'Hugh Gavin',          pos: 12, rating: 57 },
  // 13. Outside Centre
  { name: 'Garry Ringrose',      pos: 13, rating: 92 },
  { name: 'Tom Farrell',         pos: 13, rating: 80 },
  { name: 'Dan Kelly',           pos: 13, rating: 67 },
  { name: 'Jude Postlethwaite',  pos: 13, rating: 63 },
  { name: 'Cathal Forde',        pos: 13, rating: 56 },
  // 14. Right Wing
  { name: 'Mack Hansen',         pos: 14, rating: 90 },
  { name: 'Robert Baloucoune',   pos: 14, rating: 89 },
  { name: "Tommy O'Brien",       pos: 14, rating: 85 },
  { name: 'Calvin Nash',         pos: 14, rating: 83 },
  { name: 'Jordan Larmour',      pos: 14, rating: 75 },
  { name: 'Diarmuid Kilgallen',  pos: 14, rating: 60 },
  // 15. Fullback
  { name: 'Hugo Keenan',         pos: 15, rating: 94 },
  { name: 'Jamie Osborne',       pos: 15, rating: 85 },
  { name: "Jimmy O'Brien",       pos: 15, rating: 76 },
  { name: 'Mike Haley',          pos: 15, rating: 70 },
  { name: 'Mike Lowry',          pos: 15, rating: 68 },
];

const SECONDARY_RAW = [
  { name: 'Andrew Porter',       pos: 3,  rating: 80 },
  { name: 'Tadhg Beirne',        pos: 6,  rating: 96 },
  { name: 'Ryan Baird',          pos: 5,  rating: 85 },
  { name: 'Caelan Doris',        pos: 7,  rating: 94 },
  { name: 'Caelan Doris',        pos: 6,  rating: 96 },
  { name: 'Jamison Gibson-Park', pos: 14, rating: 85 },
  { name: 'Jack Crowley',        pos: 15, rating: 80 },
  { name: 'Garry Ringrose',      pos: 14, rating: 87 },
  { name: 'Hugo Keenan',         pos: 14, rating: 87 },
  { name: 'Paddy McCarthy',      pos: 3,  rating: 80 },
  { name: 'Tom Ahern',           pos: 6,  rating: 77 },
  { name: 'Cian Prendergast',    pos: 8,  rating: 79 },
  { name: 'James Ryan',          pos: 5,  rating: 90 },
  { name: 'Cian Prendergast',    pos: 5,  rating: 77 },
  { name: 'Nick Timoney',        pos: 8,  rating: 81 },
  { name: 'Jack Conan',          pos: 6,  rating: 92 },
  { name: 'Jacob Stockdale',     pos: 15, rating: 78 },
  { name: 'Bundee Aki',          pos: 13, rating: 80 },
  { name: 'Jamie Osborne',       pos: 14, rating: 78 },
  { name: 'Jamie Osborne',       pos: 12, rating: 81 },
  { name: 'Cormac Izuchukwu',    pos: 5,  rating: 77 },
  { name: 'Ciarán Frawley',      pos: 12, rating: 78 },
  { name: 'Ciarán Frawley',      pos: 15, rating: 78 },
  { name: 'Robbie Henshaw',      pos: 13, rating: 80 },
  { name: 'Mack Hansen',         pos: 15, rating: 88 },
  { name: "Jimmy O'Brien",       pos: 14, rating: 76 },
  { name: "Jimmy O'Brien",       pos: 13, rating: 72 },
  { name: 'Max Deegan',          pos: 8,  rating: 77 },
  { name: 'Josh Murphy *',       pos: 6,  rating: 60 },
  { name: 'Charlie Tector',      pos: 10, rating: 60 },
  { name: 'Jordan Larmour',      pos: 15, rating: 75 },
  { name: 'Mike Lowry',          pos: 10, rating: 68 },
  { name: "Tom O'Toole",         pos: 3,  rating: 80 },
  { name: "Jack O'Donoghue",     pos: 7,  rating: 68 },
];

export const PLAYERS: DepthPlayer[] = PLAYERS_RAW.map(p => ({ ...p, secondary: false }));
export const SECONDARY: DepthPlayer[] = SECONDARY_RAW.map(p => ({ ...p, secondary: true }));
export const ALL_PLAYERS: DepthPlayer[] = [...PLAYERS, ...SECONDARY];

// Weight sets for depth score calculation
const WEIGHT_SETS: Record<number, number[]> = {
  1: [1.00],
  2: [0.65, 0.35],
  3: [0.50, 0.30, 0.20],
  4: [0.40, 0.28, 0.20, 0.12],
  5: [0.35, 0.25, 0.20, 0.13, 0.07],
  6: [0.32, 0.24, 0.18, 0.13, 0.08, 0.05],
  7: [0.30, 0.23, 0.17, 0.12, 0.08, 0.06, 0.04],
};

export function depthScore(players: DepthPlayer[]): number {
  const sorted = [...players].sort((a, b) => b.rating - a.rating);
  const n = Math.min(sorted.length, 7);
  const w = WEIGHT_SETS[n];
  return Math.round(sorted.reduce((s, p, i) => s + p.rating * (w[i] || 0), 0));
}

export function ratingColor(r: number): string {
  if (r >= 90) return '#047857';
  if (r >= 80) return '#16A34A';
  if (r >= 70) return '#CA8A04';
  if (r >= 60) return '#D97706';
  return '#DC2626';
}

export function depthColor(s: number): string {
  if (s >= 85) return '#047857';
  if (s >= 80) return '#059669';
  if (s >= 75) return '#16A34A';
  if (s >= 70) return '#CA8A04';
  if (s >= 65) return '#D97706';
  return '#DC2626';
}

export function depthLabel(s: number): string {
  if (s >= 85) return 'Elite';
  if (s >= 80) return 'Excellent';
  if (s >= 75) return 'Strong';
  if (s >= 70) return 'Solid';
  if (s >= 65) return 'Thin';
  return 'Vulnerable';
}

export function tierBadge(r: number): [string, string] {
  if (r >= 90) return ['World Class', 't-wc'];
  if (r >= 80) return ['International', 't-int'];
  if (r >= 70) return ['Squad', 't-sq'];
  if (r >= 60) return ['Fringe', 't-fr'];
  return ['Emerging', 't-em'];
}

export function rankClass(i: number): string {
  return ['r1', 'r2', 'r3', 'ro'][Math.min(i, 3)];
}

export function getPlayersByPosition(): Record<number, DepthPlayer[]> {
  const byPos: Record<number, DepthPlayer[]> = {};
  POSITIONS.forEach(p => {
    byPos[p.id] = ALL_PLAYERS.filter(pl => pl.pos === p.id)
      .sort((a, b) => b.rating - a.rating);
  });
  return byPos;
}
