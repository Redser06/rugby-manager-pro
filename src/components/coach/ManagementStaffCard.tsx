import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AICoach, COACH_ROLES, EXPERIENCE_LEVELS, SPECIALIZATIONS } from '@/types/coach';
import { Users, Shield, Swords, Target, Dumbbell, Flag } from 'lucide-react';

interface ManagementStaffCardProps {
  coaches: AICoach[];
  teamName: string;
}

const roleIcons = {
  head_coach: Users,
  attack_coach: Swords,
  defense_coach: Shield,
  scrum_coach: Target,
  skills_coach: Dumbbell
};

export function ManagementStaffCard({ coaches, teamName }: ManagementStaffCardProps) {
  const sortedCoaches = [...coaches].sort((a, b) => {
    const roleOrder = ['head_coach', 'attack_coach', 'defense_coach', 'scrum_coach', 'skills_coach'];
    return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {teamName} Coaching Staff
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedCoaches.map(coach => {
            const Icon = roleIcons[coach.role];
            const roleLabel = COACH_ROLES.find(r => r.value === coach.role)?.label || coach.role;
            const expLabel = EXPERIENCE_LEVELS.find(e => e.value === coach.experience_level)?.label || coach.experience_level;
            const specLabel = SPECIALIZATIONS.find(s => s.value === coach.specialization)?.label || coach.specialization;

            return (
              <div
                key={coach.id}
                className="flex items-start gap-4 p-3 rounded-lg bg-muted/50"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{coach.first_name} {coach.last_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {roleLabel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Flag className="h-3 w-3" />
                    <span>{coach.nationality}</span>
                    <span>•</span>
                    <span>{expLabel}</span>
                    <span>•</span>
                    <span>{specLabel}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{coach.reputation}</span>
                  <span className="text-xs text-muted-foreground ml-1">REP</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
