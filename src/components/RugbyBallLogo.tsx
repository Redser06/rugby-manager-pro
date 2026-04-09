export function RugbyBallLogo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(-30, 50, 50)">
        {/* Ball body - white */}
        <ellipse cx="50" cy="50" rx="42" ry="24" fill="white" stroke="hsl(220, 20%, 25%)" strokeWidth="2" />
        
        {/* Gilbert-style color bands */}
        <clipPath id="ballClip">
          <ellipse cx="50" cy="50" rx="42" ry="24" />
        </clipPath>
        <g clipPath="url(#ballClip)">
          {/* Red band */}
          <rect x="8" y="44" width="84" height="3.5" fill="#D42E2E" opacity="0.9" />
          {/* Navy band */}
          <rect x="8" y="48.5" width="84" height="3" fill="#1B2A4A" opacity="0.9" />
          {/* Gold/amber band */}
          <rect x="8" y="52.5" width="84" height="3.5" fill="#C8963E" opacity="0.85" />
        </g>
        
        {/* Seam line - vertical center */}
        <ellipse cx="50" cy="50" rx="1.2" ry="24" fill="none" stroke="hsl(220, 20%, 30%)" strokeWidth="1.8" />
        
        {/* Panel seams */}
        <ellipse cx="34" cy="50" rx="1" ry="19" fill="none" stroke="hsl(220, 15%, 40%)" strokeWidth="0.7" strokeDasharray="3 2" />
        <ellipse cx="66" cy="50" rx="1" ry="19" fill="none" stroke="hsl(220, 15%, 40%)" strokeWidth="0.7" strokeDasharray="3 2" />
        
        {/* Highlight / shine */}
        <ellipse cx="38" cy="40" rx="16" ry="6" fill="white" opacity="0.35" />
      </g>
    </svg>
  );
}
