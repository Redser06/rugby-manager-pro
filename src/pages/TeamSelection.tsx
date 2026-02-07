import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LEAGUES } from '@/data/leagues';
import { generateAllAICoaches } from '@/data/coachGenerator';
import { SixNationsNation, SIX_NATIONS_LIST, NATIONAL_VENUES, NATIONAL_REPUTATIONS } from '@/types/sixNations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MapPin, Users, Trophy, Star, UserCircle, LogIn, Flag } from 'lucide-react';

const FLAG_EMOJI: Record<SixNationsNation, string> = {
  'Ireland': '🇮🇪',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Italy': '🇮🇹',
  'France': '🇫🇷',
};

export default function TeamSelection() {
  const navigate = useNavigate();
  const { selectTeam, resetGame } = useGame();
  const { isAuthenticated, user } = useAuth();
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [showNationalTeams, setShowNationalTeams] = useState(false);
  const [generatingCoaches, setGeneratingCoaches] = useState(false);

  const handleTeamSelect = async (teamId: string) => {
    setGeneratingCoaches(true);
    
    // Generate AI coaches for all teams except the selected one
    // These are stored in the game state, not in the database
    // The ai_coaches table is read-only reference data
    const allTeams = LEAGUES.flatMap(l => l.teams);
    const otherTeams = allTeams.filter(t => t.id !== teamId);
    const aiCoaches = generateAllAICoaches(otherTeams.map(t => ({ id: t.id, reputation: t.reputation })));
    
    // AI coaches are managed in local game state, not persisted to database
    // The database ai_coaches table is for shared reference data only
    
    selectTeam(teamId);
    setGeneratingCoaches(false);
    navigate('/dashboard');
  };

  const filteredTeams = selectedLeague 
    ? LEAGUES.find(l => l.id === selectedLeague)?.teams || []
    : LEAGUES.flatMap(l => l.teams);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with auth */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Select Your Team</h1>
            <p className="text-muted-foreground">Choose a team to manage and lead to glory</p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/coach">
                <Button variant="outline">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Coach Profile
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="outline">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In to Save
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mode Toggle: Club or National */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <Button
            variant={!showNationalTeams && selectedLeague === null ? 'default' : 'outline'}
            onClick={() => { setShowNationalTeams(false); setSelectedLeague(null); }}
          >
            All Leagues
          </Button>
          {LEAGUES.map(league => (
            <Button
              key={league.id}
              variant={!showNationalTeams && selectedLeague === league.id ? 'default' : 'outline'}
              onClick={() => { setShowNationalTeams(false); setSelectedLeague(league.id); }}
            >
              {league.name}
            </Button>
          ))}

          <Separator orientation="vertical" className="h-8 mx-1 hidden sm:block" />

          <Button
            variant={showNationalTeams ? 'default' : 'outline'}
            onClick={() => setShowNationalTeams(true)}
            className="gap-2"
          >
            <Flag className="h-4 w-4" />
            Six Nations
          </Button>
        </div>

        {/* National Teams Grid */}
        {showNationalTeams && (
          <div className="space-y-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Choose a national team to coach through the Six Nations Championship
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SIX_NATIONS_LIST.map(nation => (
                <Card
                  key={nation}
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-primary group"
                  onClick={() => {
                    // Select the first club team to initialize game state, then navigate to six nations
                    const firstTeam = LEAGUES[0].teams[0];
                    selectTeam(firstTeam.id);
                    navigate('/six-nations', { state: { autoNation: nation } });
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                        <span className="text-2xl">{FLAG_EMOJI[nation]}</span>
                        {nation}
                      </CardTitle>
                      <Badge variant="secondary">
                        <Trophy className="h-3 w-3 mr-1" />
                        National
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {NATIONAL_VENUES[nation]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          Competition
                        </span>
                        <span className="font-medium">Six Nations</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Star className="w-4 h-4" />
                          Reputation
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${NATIONAL_REPUTATIONS[nation]}%` }}
                            />
                          </div>
                          <span className="font-medium text-xs">{NATIONAL_REPUTATIONS[nation]}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Club Teams Grid */}
        {!showNationalTeams && (
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTeams.map(team => (
                <Card 
                  key={team.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary group ${generatingCoaches ? 'pointer-events-none opacity-50' : ''}`}
                  onClick={() => handleTeamSelect(team.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {team.name}
                      </CardTitle>
                      <Badge variant="outline">{team.shortName}</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {team.homeGround}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          Squad Size
                        </span>
                        <span className="font-medium">{team.players.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Trophy className="w-4 h-4" />
                          League
                        </span>
                        <span className="font-medium">{team.league}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Star className="w-4 h-4" />
                          Reputation
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${team.reputation}%` }}
                            />
                          </div>
                          <span className="font-medium text-xs">{team.reputation}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
