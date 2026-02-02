import { TeamKit, JerseyPattern, SockPattern } from '@/types/game';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shirt, Scissors, Footprints } from 'lucide-react';

const JERSEY_PATTERNS: { value: JerseyPattern; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'hoops', label: 'Hoops' },
  { value: 'stripes', label: 'Stripes' },
  { value: 'halves', label: 'Halves' },
  { value: 'quarters', label: 'Quarters' },
  { value: 'yoke', label: 'Yoke' },
  { value: 'band', label: 'Chest Band' },
];

const SOCK_PATTERNS: { value: SockPattern; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'hoops', label: 'Hoops' },
  { value: 'two-tone', label: 'Two-Tone' },
];

const PATTERN_SIZES: { value: TeamKit['patternSize']; label: string }[] = [
  { value: 'thin', label: 'Thin' },
  { value: 'medium', label: 'Medium' },
  { value: 'thick', label: 'Thick' },
];

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  id: string;
}

function ColorPicker({ label, value, onChange, id }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-14 h-10 p-1 cursor-pointer border-2"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

interface KitEditorProps {
  kit: TeamKit;
  onChange: (kit: TeamKit) => void;
}

export function KitEditor({ kit, onChange }: KitEditorProps) {
  const updateField = <K extends keyof TeamKit>(field: K, value: TeamKit[K]) => {
    onChange({ ...kit, [field]: value });
  };

  const showPatternOptions = kit.pattern === 'hoops' || kit.pattern === 'stripes';

  return (
    <Accordion type="multiple" defaultValue={['jersey', 'trim', 'lower']} className="w-full">
      {/* Jersey Section */}
      <AccordionItem value="jersey">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Shirt className="h-4 w-4" />
            <span>Jersey Design</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              id="primary"
              label="Primary Color"
              value={kit.primary}
              onChange={(v) => updateField('primary', v)}
            />
            <ColorPicker
              id="secondary"
              label="Secondary Color"
              value={kit.secondary}
              onChange={(v) => updateField('secondary', v)}
            />
          </div>

          <div className="space-y-2">
            <Label>Pattern Style</Label>
            <Select value={kit.pattern} onValueChange={(v) => updateField('pattern', v as JerseyPattern)}>
              <SelectTrigger>
                <SelectValue placeholder="Select pattern" />
              </SelectTrigger>
              <SelectContent>
                {JERSEY_PATTERNS.map(pattern => (
                  <SelectItem key={pattern.value} value={pattern.value}>
                    {pattern.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showPatternOptions && (
            <>
              <div className="space-y-2">
                <Label>Pattern Width</Label>
                <Select value={kit.patternSize} onValueChange={(v) => updateField('patternSize', v as TeamKit['patternSize'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PATTERN_SIZES.map(size => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Number of {kit.pattern === 'hoops' ? 'Hoops' : 'Stripes'}</Label>
                  <span className="text-sm text-muted-foreground">{kit.patternCount}</span>
                </div>
                <Slider
                  value={[kit.patternCount]}
                  onValueChange={([v]) => updateField('patternCount', v)}
                  min={2}
                  max={8}
                  step={1}
                  className="w-full"
                />
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Trim Section */}
      <AccordionItem value="trim">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            <span>Trim & Accents</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              id="accent"
              label="Accent Color"
              value={kit.accent}
              onChange={(v) => updateField('accent', v)}
            />
            <ColorPicker
              id="collarTrim"
              label="Collar Trim"
              value={kit.collarTrim}
              onChange={(v) => updateField('collarTrim', v)}
            />
          </div>
          <ColorPicker
            id="cuffTrim"
            label="Cuff Trim"
            value={kit.cuffTrim}
            onChange={(v) => updateField('cuffTrim', v)}
          />
        </AccordionContent>
      </AccordionItem>

      {/* Shorts & Socks Section */}
      <AccordionItem value="lower">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Footprints className="h-4 w-4" />
            <span>Shorts & Socks</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          {/* Shorts */}
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              id="shortsColor"
              label="Shorts Color"
              value={kit.shortsColor}
              onChange={(v) => updateField('shortsColor', v)}
            />
            <ColorPicker
              id="shortsTrim"
              label="Shorts Trim"
              value={kit.shortsTrim}
              onChange={(v) => updateField('shortsTrim', v)}
            />
          </div>

          {/* Socks */}
          <div className="border-t border-border pt-4 mt-4">
            <Label className="text-sm font-medium mb-3 block">Socks</Label>
            <div className="grid grid-cols-2 gap-4">
              <ColorPicker
                id="sockPrimary"
                label="Sock Primary"
                value={kit.sockPrimary}
                onChange={(v) => updateField('sockPrimary', v)}
              />
              <ColorPicker
                id="sockSecondary"
                label="Sock Secondary"
                value={kit.sockSecondary}
                onChange={(v) => updateField('sockSecondary', v)}
              />
            </div>

            <div className="space-y-2 mt-4">
              <Label>Sock Pattern</Label>
              <Select value={kit.sockPattern} onValueChange={(v) => updateField('sockPattern', v as SockPattern)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOCK_PATTERNS.map(pattern => (
                    <SelectItem key={pattern.value} value={pattern.value}>
                      {pattern.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {kit.sockPattern === 'hoops' && (
              <div className="space-y-3 mt-4">
                <div className="flex justify-between">
                  <Label>Number of Hoops</Label>
                  <span className="text-sm text-muted-foreground">{kit.sockHoopCount}</span>
                </div>
                <Slider
                  value={[kit.sockHoopCount]}
                  onValueChange={([v]) => updateField('sockHoopCount', v)}
                  min={1}
                  max={4}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
