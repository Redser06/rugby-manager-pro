import { useState } from 'react';
import { TeamFacilities, FacilityRating, FacilityUpgradeRequest } from '@/types/game';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2,
  Dumbbell,
  GraduationCap,
  Star,
  Users,
  TrendingUp,
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Stethoscope,
  MonitorPlay,
  TreePine,
  Home as HomeIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface FacilitiesPanelProps {
  facilities: TeamFacilities;
  teamReputation: number;
  onRequestUpgrade: (request: Omit<FacilityUpgradeRequest, 'id' | 'requestedAt' | 'status'>) => void;
}

function StarRating({ rating, max = 5 }: { rating: FacilityRating; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

function FacilityCard({
  icon: Icon,
  title,
  rating,
  description,
  canUpgrade,
  onUpgrade
}: {
  icon: React.ElementType;
  title: string;
  rating: FacilityRating;
  description: string;
  canUpgrade: boolean;
  onUpgrade: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StarRating rating={rating} />
        {canUpgrade && (
          <Button variant="outline" size="sm" onClick={onUpgrade}>
            <TrendingUp className="h-4 w-4 mr-1" />
            Upgrade
          </Button>
        )}
      </div>
    </div>
  );
}

const UPGRADE_COSTS: Record<FacilityRating, number> = {
  1: 500000,
  2: 1000000,
  3: 2500000,
  4: 5000000,
  5: 0 // Max level
};

const UPGRADE_WEEKS: Record<FacilityRating, number> = {
  1: 8,
  2: 12,
  3: 20,
  4: 30,
  5: 0
};

export function FacilitiesPanel({ facilities, teamReputation, onRequestUpgrade }: FacilitiesPanelProps) {
  const [upgradeDialog, setUpgradeDialog] = useState<{
    open: boolean;
    facilityType: 'stadium' | 'training' | 'academy';
    specificArea: string;
    currentRating: FacilityRating;
  } | null>(null);
  const [upgradeJustification, setUpgradeJustification] = useState('');

  const handleRequestUpgrade = () => {
    if (!upgradeDialog) return;
    
    const targetRating = Math.min(5, upgradeDialog.currentRating + 1) as FacilityRating;
    const cost = UPGRADE_COSTS[upgradeDialog.currentRating];
    const weeks = UPGRADE_WEEKS[upgradeDialog.currentRating];
    
    onRequestUpgrade({
      facilityType: upgradeDialog.facilityType,
      specificArea: upgradeDialog.specificArea,
      currentRating: upgradeDialog.currentRating,
      targetRating,
      estimatedCost: cost,
      completionWeeks: weeks
    });
    
    setUpgradeDialog(null);
    setUpgradeJustification('');
    toast.success('Upgrade request submitted to the board');
  };

  const openUpgradeDialog = (
    facilityType: 'stadium' | 'training' | 'academy',
    specificArea: string,
    currentRating: FacilityRating
  ) => {
    if (currentRating >= 5) {
      toast.info('This facility is already at maximum level');
      return;
    }
    setUpgradeDialog({ open: true, facilityType, specificArea, currentRating });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `€${(amount / 1000000).toFixed(1)}m`;
    }
    return `€${(amount / 1000).toFixed(0)}k`;
  };

  const getStatusBadge = (status: FacilityUpgradeRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'in_progress':
        return <Badge variant="outline"><Wrench className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="stadium">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stadium">
            <Building2 className="h-4 w-4 mr-2" />
            Stadium
          </TabsTrigger>
          <TabsTrigger value="training">
            <Dumbbell className="h-4 w-4 mr-2" />
            Training
          </TabsTrigger>
          <TabsTrigger value="academy">
            <GraduationCap className="h-4 w-4 mr-2" />
            Academy
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Wrench className="h-4 w-4 mr-2" />
            Requests
          </TabsTrigger>
        </TabsList>

        {/* Stadium Tab */}
        <TabsContent value="stadium" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HomeIcon className="h-5 w-5" />
                {facilities.stadium.name}
              </CardTitle>
              <CardDescription>Home ground and matchday facilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{facilities.stadium.capacity.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Capacity</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{facilities.stadium.seatedCapacity.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Seated Capacity</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{facilities.stadium.corporateBoxes}</p>
                  <p className="text-sm text-muted-foreground">Corporate Boxes</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="flex justify-center mb-1">
                    <StarRating rating={facilities.stadium.facilityRating} />
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Rating</p>
                </div>
              </div>

              <div className="space-y-3">
                <FacilityCard
                  icon={Building2}
                  title="Matchday Experience"
                  rating={facilities.stadium.facilityRating}
                  description="Concourse, seating, amenities"
                  canUpgrade={facilities.stadium.facilityRating < 5}
                  onUpgrade={() => openUpgradeDialog('stadium', 'Matchday Experience', facilities.stadium.facilityRating)}
                />
                <FacilityCard
                  icon={TreePine}
                  title="Pitch Quality"
                  rating={facilities.stadium.pitchQuality}
                  description="Playing surface and drainage"
                  canUpgrade={facilities.stadium.pitchQuality < 5}
                  onUpgrade={() => openUpgradeDialog('stadium', 'Pitch Quality', facilities.stadium.pitchQuality)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Facilities</CardTitle>
              <CardDescription>
                {facilities.training.trainingPitches} training pitches
                {facilities.training.indoorFacility && ' • Indoor facility available'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <FacilityCard
                icon={Building2}
                title="Main Training Center"
                rating={facilities.training.mainFacilityRating}
                description="Primary training complex"
                canUpgrade={facilities.training.mainFacilityRating < 5}
                onUpgrade={() => openUpgradeDialog('training', 'Main Training Center', facilities.training.mainFacilityRating)}
              />
              <FacilityCard
                icon={Dumbbell}
                title="Gymnasium"
                rating={facilities.training.gymRating}
                description="Strength and conditioning equipment"
                canUpgrade={facilities.training.gymRating < 5}
                onUpgrade={() => openUpgradeDialog('training', 'Gymnasium', facilities.training.gymRating)}
              />
              <FacilityCard
                icon={Stethoscope}
                title="Recovery & Medical"
                rating={facilities.training.recoveryRating}
                description="Ice baths, physio, medical center"
                canUpgrade={facilities.training.recoveryRating < 5}
                onUpgrade={() => openUpgradeDialog('training', 'Recovery & Medical', facilities.training.recoveryRating)}
              />
              <FacilityCard
                icon={MonitorPlay}
                title="Analysis Suite"
                rating={facilities.training.analysisRating}
                description="Video analysis and technology"
                canUpgrade={facilities.training.analysisRating < 5}
                onUpgrade={() => openUpgradeDialog('training', 'Analysis Suite', facilities.training.analysisRating)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academy Tab */}
        <TabsContent value="academy" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Youth Academy</span>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  Reputation: {facilities.academy.reputation}
                </Badge>
              </CardTitle>
              <CardDescription>Developing the next generation of talent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Overall Academy Rating</span>
                  <StarRating rating={facilities.academy.overallRating} />
                </div>
                <Progress value={facilities.academy.reputation} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Academy reputation affects the quality of youth intake each season
                </p>
              </div>

              <div className="space-y-3">
                <FacilityCard
                  icon={Users}
                  title="Scouting Network"
                  rating={facilities.academy.scoutingNetwork}
                  description="Regional and international talent identification"
                  canUpgrade={facilities.academy.scoutingNetwork < 5}
                  onUpgrade={() => openUpgradeDialog('academy', 'Scouting Network', facilities.academy.scoutingNetwork)}
                />
                <FacilityCard
                  icon={GraduationCap}
                  title="Coaching Quality"
                  rating={facilities.academy.coachingQuality}
                  description="Youth coaching staff and development programs"
                  canUpgrade={facilities.academy.coachingQuality < 5}
                  onUpgrade={() => openUpgradeDialog('academy', 'Coaching Quality', facilities.academy.coachingQuality)}
                />
                <FacilityCard
                  icon={Building2}
                  title="Youth Facilities"
                  rating={facilities.academy.youthFacilities}
                  description="Dedicated training grounds and accommodation"
                  canUpgrade={facilities.academy.youthFacilities < 5}
                  onUpgrade={() => openUpgradeDialog('academy', 'Youth Facilities', facilities.academy.youthFacilities)}
                />
                <FacilityCard
                  icon={TrendingUp}
                  title="First Team Pathway"
                  rating={facilities.academy.pathwayToFirstTeam}
                  description="Integration with senior squad"
                  canUpgrade={facilities.academy.pathwayToFirstTeam < 5}
                  onUpgrade={() => openUpgradeDialog('academy', 'First Team Pathway', facilities.academy.pathwayToFirstTeam)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Board Requests</CardTitle>
              <CardDescription>Track your facility upgrade requests</CardDescription>
            </CardHeader>
            <CardContent>
              {facilities.upgradeRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No upgrade requests submitted</p>
                  <p className="text-sm">Browse facilities and request upgrades from the board</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {facilities.upgradeRequests.map((request) => (
                      <div key={request.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{request.specificArea}</span>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="capitalize">{request.facilityType}</span>
                          <span>•</span>
                          <span>{request.currentRating}★ → {request.targetRating}★</span>
                          <span>•</span>
                          <span>{formatCurrency(request.estimatedCost)}</span>
                        </div>
                        {request.boardResponse && (
                          <p className="text-sm italic text-muted-foreground">
                            "{request.boardResponse}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade Dialog */}
      <Dialog open={!!upgradeDialog} onOpenChange={() => setUpgradeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Facility Upgrade</DialogTitle>
            <DialogDescription>
              Submit a proposal to the board for approval
            </DialogDescription>
          </DialogHeader>
          
          {upgradeDialog && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">{upgradeDialog.specificArea}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span>Current:</span>
                  <StarRating rating={upgradeDialog.currentRating} />
                  <span className="mx-2">→</span>
                  <span>Target:</span>
                  <StarRating rating={Math.min(5, upgradeDialog.currentRating + 1) as FacilityRating} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                  <p className="font-bold">{formatCurrency(UPGRADE_COSTS[upgradeDialog.currentRating])}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Completion Time</p>
                  <p className="font-bold">{UPGRADE_WEEKS[upgradeDialog.currentRating]} weeks</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Justification (optional)</Label>
                <Textarea
                  placeholder="Explain why this upgrade is important for the team..."
                  value={upgradeJustification}
                  onChange={(e) => setUpgradeJustification(e.target.value)}
                  rows={3}
                />
              </div>

              <p className="text-sm text-muted-foreground">
                The board will consider your team's financial position and recent performance when reviewing this request.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleRequestUpgrade}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
