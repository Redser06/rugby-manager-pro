import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EuroPool, EuroPoolTeam } from '@/types/europeanCompetition';

interface PoolTableProps {
  pool: EuroPool;
  myTeamId?: string;
}

export function PoolTable({ pool, myTeamId }: PoolTableProps) {
  const sortedTeams = [...pool.teams].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    const pdA = a.pointsFor - a.pointsAgainst;
    const pdB = b.pointsFor - b.pointsAgainst;
    if (pdB !== pdA) return pdB - pdA;
    return b.pointsFor - a.pointsFor;
  });

  const getPositionBadge = (position: number) => {
    if (position <= 2) {
      return <Badge variant="default">{position}</Badge>;
    }
    if (position <= 4) {
      return <Badge variant="secondary">{position}</Badge>;
    }
    if (position === 5) {
      return <Badge variant="outline" className="border-warning text-warning">{position}</Badge>;
    }
    return <Badge variant="destructive">{position}</Badge>;
  };

  const getLeagueBadge = (league: string) => {
    const shortNames: Record<string, string> = {
      'Gallagher Premiership': 'PREM',
      'Top 14': 'TOP14',
      'United Rugby Championship': 'URC',
    };

    // Use secondary variant for all league badges - distinct but semantic
    return (
      <Badge variant="secondary" className="text-xs">
        {shortNames[league] || league}
      </Badge>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Pos</TableHead>
          <TableHead>Team</TableHead>
          <TableHead className="text-center w-10">P</TableHead>
          <TableHead className="text-center w-10">W</TableHead>
          <TableHead className="text-center w-10">D</TableHead>
          <TableHead className="text-center w-10">L</TableHead>
          <TableHead className="text-center w-14 hidden sm:table-cell">PD</TableHead>
          <TableHead className="text-center w-10 hidden sm:table-cell">BP</TableHead>
          <TableHead className="text-center w-12 font-bold">Pts</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTeams.map((team, index) => {
          const isMyTeam = team.teamId === myTeamId;
          const pointsDiff = team.pointsFor - team.pointsAgainst;
          
          return (
            <TableRow 
              key={team.teamId}
              className={isMyTeam ? 'bg-primary/10 font-medium' : ''}
            >
              <TableCell>{getPositionBadge(index + 1)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className={isMyTeam ? 'text-primary font-bold' : ''}>
                    {team.teamName}
                  </span>
                  <div className="flex items-center gap-1">
                    {getLeagueBadge(team.league)}
                    {isMyTeam && <Badge className="text-xs">You</Badge>}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">{team.played}</TableCell>
              <TableCell className="text-center text-primary">{team.won}</TableCell>
              <TableCell className="text-center">{team.drawn}</TableCell>
              <TableCell className="text-center text-destructive">{team.lost}</TableCell>
              <TableCell className="text-center hidden sm:table-cell">
                <span className={pointsDiff > 0 ? 'text-primary' : pointsDiff < 0 ? 'text-destructive' : ''}>
                  {pointsDiff > 0 ? '+' : ''}{pointsDiff}
                </span>
              </TableCell>
              <TableCell className="text-center hidden sm:table-cell">{team.bonusPoints}</TableCell>
              <TableCell className="text-center font-bold text-lg">{team.totalPoints}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
