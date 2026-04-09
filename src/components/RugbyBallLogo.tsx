export function RugbyBallLogo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Ball body - rotated oval */}
      <g transform="rotate(-30, 50, 50)">
        <ellipse cx="50" cy="50" rx="42" ry="24" className="fill-primary" />
        {/* Seam line - horizontal */}
        <line x1="10" y1="50" x2="90" y2="50" className="stroke-primary-foreground" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* Seam line - vertical curve */}
        <ellipse cx="50" cy="50" rx="1" ry="24" className="stroke-primary-foreground" fill="none" strokeWidth="1.5" />
        {/* Panel seams */}
        <ellipse cx="35" cy="50" rx="1" ry="20" className="stroke-primary-foreground/40" fill="none" strokeWidth="0.8" />
        <ellipse cx="65" cy="50" rx="1" ry="20" className="stroke-primary-foreground/40" fill="none" strokeWidth="0.8" />
        {/* Highlight */}
        <ellipse cx="40" cy="42" rx="14" ry="6" className="fill-primary-foreground/15" />
      </g>
    </svg>
  );
}
