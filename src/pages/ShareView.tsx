import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Users, 
  Target, 
  TrendingUp, 
  Shield, 
  Swords, 
  Globe, 
  Calendar,
  Star,
  Zap,
  ArrowLeft,
  Share2
} from 'lucide-react';
import { SeasonSnapshot } from '@/types/share';

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default function ShareView() {
  const { code } = useParams<{ code: string }>();
  const [snapshot, setSnapshot] = useState<SeasonSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) {
      setError(true);
      setLoading(false);
      return;
    }

    try {
      const snapshots = JSON.parse(localStorage.getItem('seasonSnapshots') || '{}');
      const found = snapshots[code];
      
      if (found) {
        setSnapshot(found);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    
    setLoading(false);
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading season snapshot...</p>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6 space-y-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Share2 className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">Snapshot Not Found</h2>
            <p className="text-muted-foreground">
              This share link may have expired or doesn't exist.
            </p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Rugby Manager
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pointsDiff = snapshot.standing.pointsFor - snapshot.standing.pointsAgainst;
  const winRate = snapshot.standing.played > 0 
    ? Math.round((snapshot.standing.won / snapshot.standing.played) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/10 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
            <Globe className="h-4 w-4" />
            <span>Rugby Manager Season Snapshot</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{snapshot.teamName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="secondary">{snapshot.teamCountry}</Badge>
                <Badge variant="outline">{snapshot.leagueName}</Badge>
                <Badge>Season {snapshot.season} • Week {snapshot.week}</Badge>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-5xl font-bold text-primary">
                {snapshot.standing.position}<sup className="text-2xl">{getOrdinalSuffix(snapshot.standing.position)}</sup>
              </div>
              <p className="text-muted-foreground">League Position</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* League Standing Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              League Standing
            </CardTitle>
            <CardDescription>{snapshot.leagueName} - Season {snapshot.season}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-3xl font-bold text-green-500">{snapshot.standing.won}</div>
                <div className="text-sm text-muted-foreground">Wins</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-3xl font-bold text-yellow-500">{snapshot.standing.drawn}</div>
                <div className="text-sm text-muted-foreground">Draws</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-3xl font-bold text-red-500">{snapshot.standing.lost}</div>
                <div className="text-sm text-muted-foreground">Losses</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-3xl font-bold text-primary">{snapshot.standing.totalPoints}</div>
                <div className="text-sm text-muted-foreground">Points</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Win Rate</span>
                  <span className="font-medium">{winRate}%</span>
                </div>
                <Progress value={winRate} className="h-2" />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-green-500">{snapshot.standing.pointsFor}</div>
                  <div className="text-xs text-muted-foreground">Points For</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-red-500">{snapshot.standing.pointsAgainst}</div>
                  <div className="text-xs text-muted-foreground">Points Against</div>
                </div>
                <div>
                  <div className={`text-xl font-bold ${pointsDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {pointsDiff >= 0 ? '+' : ''}{pointsDiff}
                  </div>
                  <div className="text-xs text-muted-foreground">Points Diff</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* European Competition (if applicable) */}
        {snapshot.european && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-blue-500" />
                {snapshot.european.competition === 'champions' ? 'Champions Cup' : 'Challenge Cup'}
              </CardTitle>
              <CardDescription>Pool {snapshot.european.poolLetter}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold">{snapshot.european.poolPosition}</span>
                  <span className="text-muted-foreground">{getOrdinalSuffix(snapshot.european.poolPosition)} in Pool</span>
                </div>
                {snapshot.european.knockoutStage && (
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {snapshot.european.knockoutStage.toUpperCase()}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Squad Highlights & Tactical Identity */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Squad Highlights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Squad Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {snapshot.squadHighlights.playerOfTheSeason && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-transparent">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="font-medium">{snapshot.squadHighlights.playerOfTheSeason.name}</div>
                      <div className="text-xs text-muted-foreground">Star Player</div>
                    </div>
                  </div>
                  <Badge variant="secondary">{snapshot.squadHighlights.playerOfTheSeason.rating} OVR</Badge>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="text-2xl font-bold">{snapshot.squadHighlights.squadSize}</div>
                  <div className="text-xs text-muted-foreground">Squad Size</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="text-2xl font-bold">{snapshot.squadHighlights.averageAge}</div>
                  <div className="text-xs text-muted-foreground">Avg Age</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tactical Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                Tactical Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Swords className="h-4 w-4 text-red-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Attack</div>
                    <div className="font-medium capitalize">{snapshot.tacticalIdentity.attackStyle}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Defense</div>
                    <div className="font-medium capitalize">{snapshot.tacticalIdentity.defenseStyle}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Zap className="h-4 w-4 text-yellow-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Tempo</div>
                  <div className="font-medium capitalize">{snapshot.tacticalIdentity.tempo}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-2">Formation</div>
                <div className="flex gap-2">
                  <Badge variant="outline">{snapshot.tacticalIdentity.attackingShape}</Badge>
                  <Badge variant="outline">{snapshot.tacticalIdentity.defensiveShape}</Badge>
                </div>
              </div>

              {snapshot.tacticalIdentity.keyMoves.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Key Moves</div>
                  <div className="flex flex-wrap gap-1">
                    {snapshot.tacticalIdentity.keyMoves.map((move, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{move}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 space-y-4">
          <Separator />
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Calendar className="h-4 w-4" />
            <span>Snapshot created {new Date(snapshot.createdAt).toLocaleDateString()}</span>
          </div>
          <Button asChild variant="outline">
            <Link to="/">
              Start Your Own Career
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
