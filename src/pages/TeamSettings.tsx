import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamKit } from '@/types/game';
import { Palette, Save, RotateCcw } from 'lucide-react';

const PATTERNS = [
  { value: 'solid', label: 'Solid' },
  { value: 'hoops', label: 'Hoops' },
  { value: 'stripes', label: 'Stripes' },
  { value: 'halves', label: 'Halves' },
  { value: 'quarters', label: 'Quarters' },
] as const;

function KitPreview({ kit }: { kit: TeamKit }) {
  const renderPattern = () => {
    switch (kit.pattern) {
      case 'hoops':
        return (
          <div className="w-full h-full flex flex-col">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="flex-1" 
                style={{ backgroundColor: i % 2 === 0 ? kit.primary : kit.secondary }}
              />
            ))}
          </div>
        );
      case 'stripes':
        return (
          <div className="w-full h-full flex">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="flex-1" 
                style={{ backgroundColor: i % 2 === 0 ? kit.primary : kit.secondary }}
              />
            ))}
          </div>
        );
      case 'halves':
        return (
          <div className="w-full h-full flex">
            <div className="w-1/2 h-full" style={{ backgroundColor: kit.primary }} />
            <div className="w-1/2 h-full" style={{ backgroundColor: kit.secondary }} />
          </div>
        );
      case 'quarters':
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2">
            <div style={{ backgroundColor: kit.primary }} />
            <div style={{ backgroundColor: kit.secondary }} />
            <div style={{ backgroundColor: kit.secondary }} />
            <div style={{ backgroundColor: kit.primary }} />
          </div>
        );
      default:
        return <div className="w-full h-full" style={{ backgroundColor: kit.primary }} />;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Jersey */}
      <div className="relative">
        <svg width="160" height="180" viewBox="0 0 160 180">
          {/* Jersey shape */}
          <defs>
            <clipPath id="jerseyClip">
              <path d="M40,0 L120,0 L160,40 L140,50 L130,40 L130,180 L30,180 L30,40 L20,50 L0,40 Z" />
            </clipPath>
          </defs>
          <g clipPath="url(#jerseyClip)">
            <foreignObject x="0" y="0" width="160" height="180">
              <div className="w-full h-full">{renderPattern()}</div>
            </foreignObject>
          </g>
          {/* Collar accent */}
          <path 
            d="M40,0 L80,15 L120,0" 
            fill="none" 
            stroke={kit.accent} 
            strokeWidth="4"
          />
          {/* Jersey outline */}
          <path 
            d="M40,0 L120,0 L160,40 L140,50 L130,40 L130,180 L30,180 L30,40 L20,50 L0,40 Z" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="text-border"
          />
        </svg>
      </div>
      
      {/* Shorts */}
      <div 
        className="w-24 h-12 rounded-b-lg border-2 border-border"
        style={{ backgroundColor: kit.secondary }}
      />
    </div>
  );
}

export default function TeamSettings() {
  const { getMyTeam, updateKit } = useGame();
  const team = getMyTeam();
  
  const [kit, setKit] = useState<TeamKit>(team?.kit || {
    primary: '#1e3a5f',
    secondary: '#ffffff',
    accent: '#d4af37',
    pattern: 'solid'
  });
  
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (team?.kit) {
      setKit(team.kit);
      setHasChanges(false);
    }
  }, [team?.kit]);

  const handleColorChange = (field: keyof TeamKit, value: string) => {
    setKit(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handlePatternChange = (pattern: TeamKit['pattern']) => {
    setKit(prev => ({ ...prev, pattern }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateKit(kit);
    setHasChanges(false);
  };

  const handleReset = () => {
    if (team?.kit) {
      setKit(team.kit);
      setHasChanges(false);
    }
  };

  if (!team) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{team.name}</h1>
        <p className="text-muted-foreground">Team Settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kit Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Kit Designer
            </CardTitle>
            <CardDescription>Customize your team's colors and pattern</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Color Pickers */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary"
                    type="color"
                    value={kit.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={kit.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="flex-1 font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary"
                    type="color"
                    value={kit.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={kit.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="flex-1 font-mono"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accent">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="accent"
                    type="color"
                    value={kit.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={kit.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="flex-1 font-mono"
                    placeholder="#d4af37"
                  />
                </div>
              </div>
            </div>

            {/* Pattern Selector */}
            <div className="space-y-2">
              <Label>Pattern</Label>
              <Select value={kit.pattern} onValueChange={handlePatternChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  {PATTERNS.map(pattern => (
                    <SelectItem key={pattern.value} value={pattern.value}>
                      {pattern.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={!hasChanges} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Kit
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Kit Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>See how your kit will look</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <KitPreview kit={kit} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}