import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { LEAGUES } from '@/data/leagues';
import { generateAllAICoaches } from '@/data/coachGenerator';
import { SixNationsNation, SIX_NATIONS_LIST, NATIONAL_VENUES, NATIONAL_REPUTATIONS } from '@/types/sixNations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Trophy, Star, UserCircle, LogIn, Flag, ChevronLeft, ChevronRight, Sun, Moon, Tv, Zap } from 'lucide-react';
import { RugbyBallLogo } from '@/components/RugbyBallLogo';
import { Team } from '@/types/game';

const FLAG_EMOJI: Record<SixNationsNation, string> = {
  'Ireland': '🇮🇪',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Italy': '🇮🇹',
  'France': '🇫🇷',
};

const LEAGUE_COLORS: Record<string, string> = {
  'URC': 'from-blue-500 to-blue-700',
  'Gallagher Premiership': 'from-emerald-500 to-emerald-700',
  'Top 14': 'from-red-500 to-red-700',
  'Super Rugby Pacific': 'from-amber-500 to-amber-700',
};

const LEAGUE_GLOW: Record<string, string> = {
  'URC': 'shadow-blue-500/20',
  'Gallagher Premiership': 'shadow-emerald-500/20',
  'Top 14': 'shadow-red-500/20',
  'Super Rugby Pacific': 'shadow-amber-500/20',
};

const LEAGUE_BORDER_COLORS: Record<string, string> = {
  'URC': 'border-l-blue-500',
  'Gallagher Premiership': 'border-l-emerald-500',
  'Top 14': 'border-l-red-500',
  'Super Rugby Pacific': 'border-l-amber-500',
};

const LEAGUE_HOVER_GLOW: Record<string, string> = {
  'URC': 'hover:shadow-blue-500/30',
  'Gallagher Premiership': 'hover:shadow-emerald-500/30',
  'Top 14': 'hover:shadow-red-500/30',
  'Super Rugby Pacific': 'hover:shadow-amber-500/30',
};

function getReputationTier(rep: number) {
  if (rep >= 85) return { label: 'Elite', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' };
  if (rep >= 70) return { label: 'Strong', color: 'text-primary', bg: 'bg-primary/10 border-primary/30' };
  if (rep >= 55) return { label: 'Mid-Table', color: 'text-muted-foreground', bg: 'bg-muted border-border' };
  return { label: 'Developing', color: 'text-muted-foreground/70', bg: 'bg-muted/50 border-border/50' };
}

function TeamCard({ team, onClick, disabled, leagueId }: { team: Team; onClick: () => void; disabled: boolean; leagueId: string }) {
  const borderColor = LEAGUE_BORDER_COLORS[leagueId] || 'border-l-primary';
  const hoverGlow = LEAGUE_HOVER_GLOW[leagueId] || 'hover:shadow-primary/30';
  const tier = getReputationTier(team.reputation);
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex-shrink-0 w-[300px] rounded-xl border-l-4 ${borderColor} glass border border-border/40 p-5 text-left transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl ${hoverGlow} hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </div>

      {/* Reputation badge */}
      <div className="absolute top-4 right-4">
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border ${tier.bg} backdrop-blur-sm`}>
          <Star className={`w-3.5 h-3.5 ${tier.color} fill-current`} />
          <span className={`text-sm font-black ${tier.color}`}>{team.reputation}</span>
        </div>
      </div>

      {/* Team identity */}
      <div className="mb-4 pr-20">
        <h3 className="font-extrabold text-foreground text-lg leading-tight group-hover:text-primary transition-colors duration-200">
          {team.name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" className="text-[10px] font-mono tracking-wider">{team.shortName}</Badge>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${tier.color}`}>{tier.label}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="truncate">{team.homeGround}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span>Squad Depth</span>
          </div>
          <span className="font-bold text-foreground text-sm">{team.players.length}</span>
        </div>
      </div>

      {/* Reputation bar */}
      <div className="mt-4">
        <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-primary/80 to-accent-foreground rounded-full transition-all duration-700 group-hover:shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
            style={{ width: `${team.reputation}%` }}
          />
        </div>
      </div>
    </button>
  );
}

function HorizontalScrollRow({ title, teams, leagueId, onTeamSelect, disabled, gradient }: {
  title: string;
  teams: Team[];
  leagueId: string;
  onTeamSelect: (teamId: string) => void;
  disabled: boolean;
  gradient: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const glow = LEAGUE_GLOW[leagueId] || '';

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  return (
    <div className="group/row">
      {/* League header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-2 rounded-full bg-gradient-to-b ${gradient} shadow-lg ${glow}`} />
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">{title}</h2>
          <Badge variant="secondary" className="text-[10px] font-semibold">{teams.length} teams</Badge>
        </div>
        <div className="flex gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll('left')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll('right')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {teams.map(team => (
          <TeamCard
            key={team.id}
            team={team}
            leagueId={leagueId}
            onClick={() => onTeamSelect(team.id)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

export default function TeamSelection() {
  const navigate = useNavigate();
  const { selectTeam } = useGame();
  const { isAuthenticated } = useAuth();
  const { mode, skin, toggleMode, toggleSkin } = useTheme();
  const [generatingCoaches, setGeneratingCoaches] = useState(false);

  const handleTeamSelect = async (teamId: string) => {
    setGeneratingCoaches(true);
    const allTeams = LEAGUES.flatMap(l => l.teams);
    const otherTeams = allTeams.filter(t => t.id !== teamId);
    generateAllAICoaches(otherTeams.map(t => ({ id: t.id, reputation: t.reputation })));
    selectTeam(teamId);
    setGeneratingCoaches(false);
    navigate('/dashboard');
  };

  const handleNationSelect = (nation: SixNationsNation) => {
    const firstTeam = LEAGUES[0].teams[0];
    selectTeam(firstTeam.id);
    navigate('/six-nations', { state: { autoNation: nation } });
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent-foreground/5 blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-primary/3 blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
      </div>

      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-border/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent-foreground/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              {/* Logo with glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150" />
                <RugbyBallLogo className="relative w-16 h-16 drop-shadow-2xl" />
              </div>
              <div>
                <h1 className="text-5xl font-black text-foreground tracking-tight leading-none">
                  On the Gain Line
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <p className="text-xs text-muted-foreground font-bold tracking-[0.25em] uppercase">
                    Rugby's head coach game simulator
                  </p>
                </div>
                <p className="text-muted-foreground text-sm mt-3 flex items-center gap-2">
                  <span className="inline-block w-8 h-[1px] bg-primary/40" />
                  Choose your team and lead them to glory
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={toggleMode} title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
                {mode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button variant={skin === 'broadcast' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 rounded-full" onClick={toggleSkin} title="Broadcast Mode">
                <Tv className="h-4 w-4" />
              </Button>
              <div className="w-[1px] h-6 bg-border/50 mx-1" />
              {isAuthenticated ? (
                <Link to="/coach">
                  <Button variant="outline" size="sm" className="rounded-full">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Coach Profile
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="rounded-full">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In to Save
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Loading overlay */}
        {generatingCoaches && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center">
            <div className="text-center space-y-4 glass rounded-2xl p-8">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <RugbyBallLogo className="absolute inset-2 w-12 h-12" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">Setting up your season...</p>
            </div>
          </div>
        )}

        {/* Club leagues */}
        {LEAGUES.map(league => (
          <HorizontalScrollRow
            key={league.id}
            title={league.name}
            teams={league.teams}
            leagueId={league.name}
            onTeamSelect={handleTeamSelect}
            disabled={generatingCoaches}
            gradient={LEAGUE_COLORS[league.name] || 'from-primary to-primary/70'}
          />
        ))}

        {/* Six Nations section */}
        <div className="group/row">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="h-8 w-2 rounded-full bg-gradient-to-b from-green-500 to-green-700 shadow-lg shadow-green-500/20" />
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">Six Nations</h2>
            <Badge variant="secondary" className="text-[10px] font-semibold">International</Badge>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
            {SIX_NATIONS_LIST.map(nation => {
              const tier = getReputationTier(NATIONAL_REPUTATIONS[nation]);
              return (
                <button
                  key={nation}
                  onClick={() => handleNationSelect(nation)}
                  className="group relative flex-shrink-0 w-[300px] rounded-xl border-l-4 border-l-green-500 glass border border-border/40 p-5 text-left transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl hover:shadow-green-500/20 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </div>

                  <div className="absolute top-4 right-4">
                    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border ${tier.bg} backdrop-blur-sm`}>
                      <Star className={`w-3.5 h-3.5 ${tier.color} fill-current`} />
                      <span className={`text-sm font-black ${tier.color}`}>{NATIONAL_REPUTATIONS[nation]}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4 pr-20">
                    <span className="text-4xl drop-shadow-md">{FLAG_EMOJI[nation]}</span>
                    <div>
                      <h3 className="font-extrabold text-foreground text-lg group-hover:text-primary transition-colors duration-200">{nation}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">
                          <Flag className="w-2.5 h-2.5 mr-1" />
                          National
                        </Badge>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${tier.color}`}>{tier.label}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground/50" />
                      <span>{NATIONAL_VENUES[nation]}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <span>Competition</span>
                      </div>
                      <span className="font-bold text-foreground text-sm">Six Nations</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 via-green-400 to-emerald-500 rounded-full group-hover:shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                        style={{ width: `${NATIONAL_REPUTATIONS[nation]}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
