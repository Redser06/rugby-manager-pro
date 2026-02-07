import { useSixNations } from '@/contexts/SixNationsContext';
import { SixNationsNation } from '@/types/sixNations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const FLAG_EMOJI: Record<SixNationsNation, string> = {
  'Ireland': '🇮🇪',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Italy': '🇮🇹',
  'France': '🇫🇷',
};

export function SixNationsStandings() {
  const { sixNationsState } = useSixNations();

  if (!sixNationsState) return null;

  const standings = [...sixNationsState.standings].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
    return b.triesFor - a.triesFor;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Championship Table</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Nation</TableHead>
              <TableHead className="text-center">P</TableHead>
              <TableHead className="text-center">W</TableHead>
              <TableHead className="text-center">D</TableHead>
              <TableHead className="text-center">L</TableHead>
              <TableHead className="text-center">PF</TableHead>
              <TableHead className="text-center">PA</TableHead>
              <TableHead className="text-center">PD</TableHead>
              <TableHead className="text-center">TF</TableHead>
              <TableHead className="text-center">BP</TableHead>
              <TableHead className="text-center font-bold">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((s, idx) => {
              const isUser = s.nation === sixNationsState.userNation;
              // Check for Grand Slam
              const isGrandSlam = s.played === 5 && s.won === 5;
              return (
                <TableRow key={s.nation} className={isUser ? 'bg-primary/10' : ''}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{FLAG_EMOJI[s.nation]}</span>
                      <span className={isUser ? 'font-bold' : ''}>{s.nation}</span>
                      {isGrandSlam && (
                        <Badge variant="default" className="text-xs">Grand Slam</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{s.played}</TableCell>
                  <TableCell className="text-center">{s.won}</TableCell>
                  <TableCell className="text-center">{s.drawn}</TableCell>
                  <TableCell className="text-center">{s.lost}</TableCell>
                  <TableCell className="text-center">{s.pointsFor}</TableCell>
                  <TableCell className="text-center">{s.pointsAgainst}</TableCell>
                  <TableCell className="text-center font-medium">
                    {s.pointsDiff > 0 ? `+${s.pointsDiff}` : s.pointsDiff}
                  </TableCell>
                  <TableCell className="text-center">{s.triesFor}</TableCell>
                  <TableCell className="text-center">{s.bonusPoints}</TableCell>
                  <TableCell className="text-center font-bold text-primary">{s.totalPoints}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
