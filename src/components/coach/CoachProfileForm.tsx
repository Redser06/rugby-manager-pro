import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CoachProfile, EXPERIENCE_LEVELS, SPECIALIZATIONS, ExperienceLevel, Specialization } from '@/types/coach';
import { User, Trophy, Target, Loader2 } from 'lucide-react';

const NATIONALITIES = [
  'Ireland', 'Wales', 'Scotland', 'England', 'France', 'Italy',
  'New Zealand', 'Australia', 'South Africa', 'Argentina', 'Japan',
  'Fiji', 'Samoa', 'Tonga', 'Georgia', 'Romania', 'USA', 'Canada'
];

interface CoachProfileFormProps {
  initialData?: Partial<CoachProfile>;
  onSubmit: (data: Omit<CoachProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function CoachProfileForm({ initialData, onSubmit, isLoading, submitLabel = 'Create Profile' }: CoachProfileFormProps) {
  const [firstName, setFirstName] = useState(initialData?.first_name || '');
  const [lastName, setLastName] = useState(initialData?.last_name || '');
  const [nationality, setNationality] = useState(initialData?.nationality || '');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(initialData?.experience_level || 'developing');
  const [specialization, setSpecialization] = useState<Specialization>(initialData?.specialization || 'balanced');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      first_name: firstName,
      last_name: lastName,
      nationality,
      experience_level: experienceLevel,
      specialization,
      career_started_season: initialData?.career_started_season || 1
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Details
          </CardTitle>
          <CardDescription>Enter your coach's basic information</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Smith"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Select value={nationality} onValueChange={setNationality} required>
              <SelectTrigger>
                <SelectValue placeholder="Select nationality" />
              </SelectTrigger>
              <SelectContent>
                {NATIONALITIES.map(nat => (
                  <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Experience Level
          </CardTitle>
          <CardDescription>How experienced is your coach?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={experienceLevel}
            onValueChange={(v) => setExperienceLevel(v as ExperienceLevel)}
            className="grid gap-3"
          >
            {EXPERIENCE_LEVELS.map(level => (
              <div key={level.value} className="flex items-center space-x-3">
                <RadioGroupItem value={level.value} id={level.value} />
                <Label htmlFor={level.value} className="font-normal cursor-pointer">
                  {level.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Coaching Specialization
          </CardTitle>
          <CardDescription>What aspect of the game do you focus on?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={specialization}
            onValueChange={(v) => setSpecialization(v as Specialization)}
            className="grid gap-4"
          >
            {SPECIALIZATIONS.map(spec => (
              <div key={spec.value} className="flex items-start space-x-3">
                <RadioGroupItem value={spec.value} id={spec.value} className="mt-1" />
                <div>
                  <Label htmlFor={spec.value} className="font-medium cursor-pointer">
                    {spec.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{spec.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading || !firstName || !lastName || !nationality}>
        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
