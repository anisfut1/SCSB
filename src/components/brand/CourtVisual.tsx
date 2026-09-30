/**
 * Visuel abstrait sport-tech (login, états vides larges) : tracé de
 * demi-terrain en lignes fines + halo d'accent. Purement décoratif, CSS/SVG
 * uniquement (aucune image, aucune donnée).
 */
export function CourtVisual({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 640" fill="none" aria-hidden className={className} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="cv-glow" cx="50%" cy="38%" r="55%">
          <stop offset="0%" stopColor="var(--club-accent)" stopOpacity="0.28" />
          <stop offset="60%" stopColor="var(--club-accent)" stopOpacity="0.04" />
          <stop offset="100%" stopColor="var(--club-accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cv-line" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="cv-accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--club-accent)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--club-accent)" stopOpacity="0.2" />
        </linearGradient>
        <pattern id="cv-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" stroke="var(--foreground)" strokeOpacity="0.05" />
        </pattern>
      </defs>
      <rect width="600" height="640" fill="url(#cv-grid)" />
      <rect width="600" height="640" fill="url(#cv-glow)" />
      <g stroke="url(#cv-line)" strokeWidth="1.25">
        <rect x="60" y="40" width="480" height="560" rx="4" />
        <path d="M60 320H540" />
        <circle cx="300" cy="320" r="62" />
        <circle cx="300" cy="320" r="18" />
        {/* raquette haute */}
        <rect x="228" y="40" width="144" height="176" />
        <path d="M242 216a58 58 0 0 0 116 0" />
        <path d="M110 40v84a190 190 0 0 0 380 0V40" />
        {/* raquette basse */}
        <rect x="228" y="424" width="144" height="176" />
        <path d="M242 424a58 58 0 0 1 116 0" />
        <path d="M110 600v-84a190 190 0 0 1 380 0v84" />
      </g>
      {/* trajectoire accent */}
      <path d="M150 520C210 380 330 250 300 92" stroke="url(#cv-accent)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 10" />
      <circle cx="300" cy="84" r="7" fill="var(--club-accent)" fillOpacity="0.9" />
      <circle cx="300" cy="84" r="18" stroke="var(--club-accent)" strokeOpacity="0.35" />
      <circle cx="150" cy="520" r="4" fill="var(--foreground)" fillOpacity="0.5" />
    </svg>
  );
}
