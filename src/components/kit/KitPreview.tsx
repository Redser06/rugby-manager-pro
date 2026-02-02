import { TeamKit } from '@/types/game';

interface KitPreviewProps {
  kit: TeamKit;
  size?: 'sm' | 'md' | 'lg';
}

export function KitPreview({ kit, size = 'md' }: KitPreviewProps) {
  const scale = size === 'sm' ? 0.6 : size === 'lg' ? 1.2 : 1;
  const width = 180 * scale;
  const jerseyHeight = 200 * scale;
  const shortsHeight = 60 * scale;
  const sockHeight = 80 * scale;
  
  const getPatternStripeWidth = () => {
    switch (kit.patternSize) {
      case 'thin': return 100 / (kit.patternCount * 2);
      case 'thick': return 100 / kit.patternCount;
      default: return 100 / (kit.patternCount * 1.5);
    }
  };

  const renderJerseyPattern = () => {
    const stripeWidth = getPatternStripeWidth();
    
    switch (kit.pattern) {
      case 'hoops':
        return (
          <div className="w-full h-full flex flex-col">
            {[...Array(kit.patternCount * 2)].map((_, i) => (
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
            {[...Array(kit.patternCount * 2 - 1)].map((_, i) => (
              <div 
                key={i} 
                style={{ 
                  backgroundColor: i % 2 === 0 ? kit.primary : kit.secondary,
                  width: `${stripeWidth}%`
                }}
                className="h-full"
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
      case 'yoke':
        return (
          <div className="w-full h-full relative" style={{ backgroundColor: kit.primary }}>
            <div 
              className="absolute top-0 left-0 right-0" 
              style={{ 
                backgroundColor: kit.secondary,
                height: '35%',
                clipPath: 'polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)'
              }} 
            />
          </div>
        );
      case 'band':
        return (
          <div className="w-full h-full flex flex-col" style={{ backgroundColor: kit.primary }}>
            <div className="flex-1" />
            <div style={{ backgroundColor: kit.secondary, height: '25%' }} />
            <div className="flex-1" />
          </div>
        );
      default:
        return <div className="w-full h-full" style={{ backgroundColor: kit.primary }} />;
    }
  };

  const renderSockPattern = () => {
    switch (kit.sockPattern) {
      case 'hoops':
        return (
          <div className="w-full h-full flex flex-col">
            {[...Array(kit.sockHoopCount * 2 + 1)].map((_, i) => (
              <div 
                key={i} 
                className="flex-1" 
                style={{ backgroundColor: i % 2 === 0 ? kit.sockPrimary : kit.sockSecondary }}
              />
            ))}
          </div>
        );
      case 'two-tone':
        return (
          <div className="w-full h-full flex flex-col">
            <div className="h-1/2" style={{ backgroundColor: kit.sockSecondary }} />
            <div className="h-1/2" style={{ backgroundColor: kit.sockPrimary }} />
          </div>
        );
      default:
        return <div className="w-full h-full" style={{ backgroundColor: kit.sockPrimary }} />;
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Jersey */}
      <div className="relative">
        <svg width={width} height={jerseyHeight} viewBox="0 0 180 200">
          <defs>
            <clipPath id="jerseyClip">
              <path d="M45,0 L135,0 L180,45 L157,58 L145,45 L145,200 L35,200 L35,45 L23,58 L0,45 Z" />
            </clipPath>
            <clipPath id="collarClip">
              <path d="M45,0 L90,18 L135,0 L120,8 L90,22 L60,8 Z" />
            </clipPath>
            <clipPath id="leftCuffClip">
              <rect x="0" y="40" width="30" height="20" />
            </clipPath>
            <clipPath id="rightCuffClip">
              <rect x="150" y="40" width="30" height="20" />
            </clipPath>
          </defs>
          
          {/* Main jersey body */}
          <g clipPath="url(#jerseyClip)">
            <foreignObject x="0" y="0" width="180" height="200">
              <div className="w-full h-full">{renderJerseyPattern()}</div>
            </foreignObject>
          </g>
          
          {/* Collar trim */}
          <path 
            d="M45,0 L90,18 L135,0" 
            fill="none" 
            stroke={kit.collarTrim} 
            strokeWidth="6"
            strokeLinecap="round"
          />
          
          {/* Cuff trims */}
          <line x1="0" y1="45" x2="23" y2="58" stroke={kit.cuffTrim} strokeWidth="4" strokeLinecap="round" />
          <line x1="180" y1="45" x2="157" y2="58" stroke={kit.cuffTrim} strokeWidth="4" strokeLinecap="round" />
          
          {/* Jersey outline */}
          <path 
            d="M45,0 L135,0 L180,45 L157,58 L145,45 L145,200 L35,200 L35,45 L23,58 L0,45 Z" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="text-border"
          />
        </svg>
      </div>
      
      {/* Shorts */}
      <div className="relative">
        <svg width={width * 0.7} height={shortsHeight} viewBox="0 0 120 60">
          <defs>
            <clipPath id="shortsClip">
              <path d="M5,0 L115,0 L110,55 L70,55 L60,45 L50,55 L10,55 Z" />
            </clipPath>
          </defs>
          
          {/* Shorts body */}
          <path 
            d="M5,0 L115,0 L110,55 L70,55 L60,45 L50,55 L10,55 Z" 
            fill={kit.shortsColor}
          />
          
          {/* Shorts trim - side stripes */}
          <line x1="5" y1="0" x2="10" y2="55" stroke={kit.shortsTrim} strokeWidth="4" />
          <line x1="115" y1="0" x2="110" y2="55" stroke={kit.shortsTrim} strokeWidth="4" />
          
          {/* Shorts outline */}
          <path 
            d="M5,0 L115,0 L110,55 L70,55 L60,45 L50,55 L10,55 Z" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="text-border"
          />
        </svg>
      </div>
      
      {/* Socks */}
      <div className="flex gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="relative">
            <svg width={width * 0.18} height={sockHeight} viewBox="0 0 35 80">
              <defs>
                <clipPath id={`sockClip${i}`}>
                  <path d="M5,0 L30,0 L30,55 Q30,70 20,78 L15,78 Q5,70 5,55 Z" />
                </clipPath>
              </defs>
              
              {/* Sock body */}
              <g clipPath={`url(#sockClip${i})`}>
                <foreignObject x="0" y="0" width="35" height="80">
                  <div className="w-full h-full">{renderSockPattern()}</div>
                </foreignObject>
              </g>
              
              {/* Sock outline */}
              <path 
                d="M5,0 L30,0 L30,55 Q30,70 20,78 L15,78 Q5,70 5,55 Z" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
                className="text-border"
              />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
