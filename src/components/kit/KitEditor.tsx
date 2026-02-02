import { useState, useRef } from 'react';
import { TeamKit, JerseyPattern, SockPattern } from '@/types/game';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Shirt, Scissors, Footprints, Upload, Loader2, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof TeamKit>(field: K, value: TeamKit[K]) => {
    onChange({ ...kit, [field]: value });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsAnalyzing(true);
    toast.info('Analyzing kit image...');

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const imageBase64 = await base64Promise;

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('analyze-kit', {
        body: { imageBase64 }
      });

      if (error) {
        throw new Error(error.message || 'Failed to analyze image');
      }

      if (data?.kit) {
        onChange(data.kit as TeamKit);
        toast.success('Kit design extracted successfully!');
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Kit analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze kit image');
    } finally {
      setIsAnalyzing(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const showPatternOptions = kit.pattern === 'hoops' || kit.pattern === 'stripes';

  return (
    <div className="space-y-4">
      {/* Image Upload Section */}
      <div className="p-4 border border-dashed border-border rounded-lg bg-muted/30">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="kit-image-upload"
        />
        <div className="flex flex-col items-center gap-3 text-center">
          <Camera className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Upload a kit image</p>
            <p className="text-xs text-muted-foreground">AI will extract colors and patterns automatically</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </>
            )}
          </Button>
        </div>
      </div>

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
    </div>
  );
}
