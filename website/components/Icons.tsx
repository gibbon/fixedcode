// Type marks — small, neutral. Replaced earlier hand-drawn human/robot SVGs
// (those had become an "AI slop" smell). Each renders a short label in a
// bordered box so callers stay drop-in: <PersonIcon className="w-7 h-7" /> works.

function Mark({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center font-mono text-[0.65em] tracking-wider border border-border rounded-sm bg-surface text-foreground/80 select-none ${className}`}
      aria-hidden
    >
      {label}
    </span>
  );
}

export function PersonIcon({ className = "" }: { className?: string }) {
  return <Mark label="DEV" className={className} />;
}

export function RobotIcon({ className = "" }: { className?: string }) {
  return <Mark label="TEAM" className={className} />;
}

export function FactoryIcon({ className = "" }: { className?: string }) {
  return <Mark label="ORG" className={className} />;
}
