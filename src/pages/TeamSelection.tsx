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
import { MapPin, Users, Trophy, Star, UserCircle, LogIn, Flag, ChevronLeft, ChevronRight, Sun, Moon, Tv } from 'lucide-react';
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

// League accent colors for the left border
const LEAGUE_COLORS: Record<string, string> = {
  'URC': 'from-blue-500 to-blue-700',
  'Gallagher Premiership': 'from-emerald-500 to-emerald-700',
  'Top 14': 'from-red-500 to-red-700',
  'Super Rugby Pacific': 'from-amber-500 to-amber-700',
};

const LEAGUE_BORDER_COLORS: Record<string, string> = {
  'URC': 'border-l-blue-500',
  'Gallagher Premiership': 'border-l-emerald-500',
  'Top 14': 'border-l-red-500',
  'Super Rugby Pacific': 'border-l-amber-500',
};

function TeamCard({ team, onClick, disabled, leagueId }: { team: Team; onClick: () => void; disabled: boolean; leagueId: string }) {
  const borderColor = LEAGUE_BORDER_COLORS[leagueId] || 'border-l-primary';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex-shrink-0 w-[280px] rounded-xl border-l-4 ${borderColor} bg-card/80 backdrop-blur-sm border border-border/50 p-4 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:border-primary/50 hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Reputation badge - top right */}
      <div className="absolute top-3 right-3">
        <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2.5 py-1">
          <Star className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-bold text-primary">{team.reputation}</span>
        </div>
      </div>

      {/* Team name and short code */}
      <div className="mb-3 pr-16">
        <h3 className="font-bold text-foreground text-base leading-tight group-hover:text-primary transition-colors">
          {team.name}
        </h3>
        <Badge variant="outline" className="mt-1 text-[10px] font-mono">{team.shortName}</Badge>
      </div>

      {/* Stats grid */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-muted-foreground/60" />
          <span className="truncate">{team.homeGround}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-muted-foreground/60" />
            <span>Squad</span>
          </div>
          <span className="font-medium text-foreground">{team.players.length}</span>
        </div>
      </div>

      {/* Reputation bar */}
      <div className="mt-3">
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
            style={{ width: `${team.reputation}%` }}
          />
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="group/row">
      {/* League header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3">
          <div className={`h-6 w-1.5 rounded-full bg-gradient-to-b ${gradient}`} />
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <Badge variant="secondary" className="text-[10px]">{teams.length} teams</Badge>
        </div>
        <div className="flex gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => scroll('left')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => scroll('right')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
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
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-border/30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4" />
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <img src={rugbyBallIcon} alt="Rugby ball" width={512} height={512} className="w-16 h-16 object-contain drop-shadow-lg" />
                <div>
                  <h1 className="text-4xl font-extrabold text-foreground tracking-tight">On the Gain Line</h1>
                  <p className="text-xs text-muted-foreground font-semibold tracking-widest uppercase mt-0.5">Rugby's head coach game simulator</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mt-1 ml-20">Choose your team and lead them to glory</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMode} title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
                {mode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button variant={skin === 'broadcast' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={toggleSkin} title="Broadcast Mode">
                <Tv className="h-4 w-4" />
              </Button>
              {isAuthenticated ? (
                <Link to="/coach">
                  <Button variant="outline" size="sm">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Coach Profile
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm">
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
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
        {/* Loading overlay */}
        {generatingCoaches && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Setting up your season...</p>
            </div>
          </div>
        )}

        {/* Club leagues - horizontal scroll rows */}
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
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="h-6 w-1.5 rounded-full bg-gradient-to-b from-green-500 to-green-700" />
            <h2 className="text-lg font-bold text-foreground">Six Nations</h2>
            <Badge variant="secondary" className="text-[10px]">International</Badge>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {SIX_NATIONS_LIST.map(nation => (
              <button
                key={nation}
                onClick={() => handleNationSelect(nation)}
                className="group flex-shrink-0 w-[280px] rounded-xl border-l-4 border-l-green-500 bg-card/80 backdrop-blur-sm border border-border/50 p-4 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:border-primary/50 hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <div className="absolute top-3 right-3">
                  <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2.5 py-1">
                    <Star className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-bold text-primary">{NATIONAL_REPUTATIONS[nation]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{FLAG_EMOJI[nation]}</span>
                  <div>
                    <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">{nation}</h3>
                    <Badge variant="outline" className="mt-0.5 text-[10px]">
                      <Flag className="w-2.5 h-2.5 mr-1" />
                      National
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-muted-foreground/60" />
                    <span>{NATIONAL_VENUES[nation]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-3 h-3 text-muted-foreground/60" />
                      <span>Competition</span>
                    </div>
                    <span className="font-medium text-foreground">Six Nations</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                      style={{ width: `${NATIONAL_REPUTATIONS[nation]}%` }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
