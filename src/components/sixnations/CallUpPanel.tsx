import { useSixNations } from '@/contexts/SixNationsContext';
import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, Activity } from 'lucide-react';

export function CallUpPanel() {
  const { sixNationsState, getCallUpsForClub } = useSixNations();
  const { getMyTeam } = useGame();

  const team = getMyTeam();
  if (!team || !sixNationsState) return null;

  const clubCallUps = getCallUpsForClub(team.id);

  if (clubCallUps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            International Call-Ups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            None of your players have been called up for the Six Nations this year.
          </p>
        </CardContent>
      </Card>
    );
  }

  const injuredCount = clubCallUps.filter(c => c.injured).length;
  const suspendedCount = clubCallUps.filter(c => c.suspended).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            International Call-Ups ({clubCallUps.length})
          </CardTitle>
          {sixNationsState.completed && (injuredCount > 0 || suspendedCount > 0) && (
            <div className="flex gap-2">
              {injuredCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <Activity className="h-3 w-3" />
                  {injuredCount} injured
                </Badge>
              )}
              {suspendedCount > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {suspendedCount} suspended
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sixNationsState.active && (
          <div className="mb-3 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 inline mr-1 text-destructive" />
              These players are unavailable for club selection during the Six Nations window.
            </p>
          </div>
        )}

        <ScrollArea className="max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Nation</TableHead>
                <TableHead className="text-center">OVR</TableHead>
                {sixNationsState.completed && (
                  <TableHead>Status</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {clubCallUps.map(callUp => (
                <TableRow key={callUp.playerId}>
                  <TableCell className="font-medium">{callUp.playerName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{callUp.position}</Badge>
                  </TableCell>
                  <TableCell>{callUp.nation}</TableCell>
                  <TableCell className="text-center">{callUp.overall}</TableCell>
                  {sixNationsState.completed && (
                    <TableCell>
                      {callUp.injured ? (
                        <Badge variant="destructive" className="text-xs">
                          Injured ({callUp.injuryWeeks}w)
                        </Badge>
                      ) : callUp.suspended ? (
                        <Badge variant="secondary" className="text-xs">
                          Suspended ({callUp.suspensionWeeks}w)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-primary">
                          Returned fit
                        </Badge>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
