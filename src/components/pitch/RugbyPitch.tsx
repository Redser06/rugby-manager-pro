import { cn } from '@/lib/utils';

interface RugbyPitchProps {
  children?: React.ReactNode;
  className?: string;
  showZones?: boolean;
}

export function RugbyPitch({ children, className, showZones = true }: RugbyPitchProps) {
  return (
    <div className={cn("relative bg-emerald-600 rounded-lg overflow-hidden", className)}>
      {/* Pitch markings */}
      <svg 
        viewBox="0 0 100 70" 
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grass pattern */}
        <defs>
          <pattern id="grass" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="hsl(var(--chart-2))" fillOpacity="0.3" />
            <rect x="0" y="0" width="5" height="10" fill="hsl(var(--chart-2))" fillOpacity="0.4" />
          </pattern>
        </defs>
        <rect width="100" height="70" fill="url(#grass)" />
        
        {/* Try lines */}
        <line x1="10" y1="0" x2="10" y2="70" stroke="white" strokeWidth="0.5" />
        <line x1="90" y1="0" x2="90" y2="70" stroke="white" strokeWidth="0.5" />
        
        {/* In-goal areas */}
        <rect x="0" y="0" width="10" height="70" fill="hsl(var(--chart-2))" fillOpacity="0.2" />
        <rect x="90" y="0" width="10" height="70" fill="hsl(var(--chart-2))" fillOpacity="0.2" />
        
        {/* 22m lines */}
        <line x1="25" y1="0" x2="25" y2="70" stroke="white" strokeWidth="0.3" strokeDasharray="2,1" />
        <line x1="75" y1="0" x2="75" y2="70" stroke="white" strokeWidth="0.3" strokeDasharray="2,1" />
        
        {/* 10m lines */}
        <line x1="40" y1="0" x2="40" y2="70" stroke="white" strokeWidth="0.2" strokeDasharray="1,1" />
        <line x1="60" y1="0" x2="60" y2="70" stroke="white" strokeWidth="0.2" strokeDasharray="1,1" />
        
        {/* Halfway line */}
        <line x1="50" y1="0" x2="50" y2="70" stroke="white" strokeWidth="0.4" />
        
        {/* Centre spot */}
        <circle cx="50" cy="35" r="0.8" fill="white" />
        
        {/* 5m lines (touch) */}
        <line x1="10" y1="5" x2="90" y2="5" stroke="white" strokeWidth="0.2" strokeDasharray="1,2" />
        <line x1="10" y1="65" x2="90" y2="65" stroke="white" strokeWidth="0.2" strokeDasharray="1,2" />
        
        {/* 15m lines */}
        <line x1="10" y1="12" x2="90" y2="12" stroke="white" strokeWidth="0.15" strokeDasharray="0.5,1.5" />
        <line x1="10" y1="58" x2="90" y2="58" stroke="white" strokeWidth="0.15" strokeDasharray="0.5,1.5" />
        
        {/* Zone labels */}
        {showZones && (
          <>
            <text x="5" y="36" fontSize="2" fill="white" fillOpacity="0.5" textAnchor="middle">IN-GOAL</text>
            <text x="17.5" y="36" fontSize="2" fill="white" fillOpacity="0.5" textAnchor="middle">22</text>
            <text x="32.5" y="36" fontSize="2" fill="white" fillOpacity="0.5" textAnchor="middle">10-22</text>
            <text x="50" y="36" fontSize="2" fill="white" fillOpacity="0.5" textAnchor="middle">MIDFIELD</text>
            <text x="67.5" y="36" fontSize="2" fill="white" fillOpacity="0.5" textAnchor="middle">10-22</text>
            <text x="82.5" y="36" fontSize="2" fill="white" fillOpacity="0.5" textAnchor="middle">22</text>
            <text x="95" y="36" fontSize="2" fill="white" fillOpacity="0.5" textAnchor="middle">IN-GOAL</text>
          </>
        )}
      </svg>
      
      {/* Children overlay for players/lines */}
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}
