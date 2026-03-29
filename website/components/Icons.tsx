export function PersonIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="16" r="10" />
      <path d="M16 58v-12a16 16 0 0132 0v12" />
    </svg>
  );
}

export function RobotIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="16" y="18" width="32" height="28" rx="4" />
      <circle cx="26" cy="30" r="3" fill="currentColor" />
      <circle cx="38" cy="30" r="3" fill="currentColor" />
      <path d="M24 40h16" />
      <line x1="32" y1="8" x2="32" y2="18" />
      <circle cx="32" cy="6" r="3" />
      <path d="M12 32h4M48 32h4" />
      <path d="M20 46v10M44 46v10" />
    </svg>
  );
}

export function FactoryIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 56V28l12-10v10l12-10v10l12-10v10h12v28H8z" />
      <rect x="16" y="40" width="8" height="16" rx="1" />
      <rect x="28" y="40" width="8" height="16" rx="1" />
      <rect x="40" y="40" width="8" height="16" rx="1" />
      <rect x="44" y="14" width="6" height="14" rx="1" />
      <path d="M46 14c0-3 1-6 4-6" />
    </svg>
  );
}
