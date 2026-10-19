/** Original route diagram. Decorative, deliberately contains no invented metrics. */
export function Pathway({ compact = false }: { compact?: boolean }) {
  return <svg className={`pathway${compact ? " pathway-compact" : ""}`} viewBox="0 0 600 540" fill="none" aria-hidden="true">
    <circle cx="300" cy="270" r="230" fill="currentColor" opacity=".04" />
    <circle cx="300" cy="270" r="175" stroke="currentColor" opacity=".12" />
    <circle cx="300" cy="270" r="115" stroke="currentColor" opacity=".12" />
    <path data-path-line d="M70 430H210V310H390V150H530" stroke="currentColor" strokeWidth="62" strokeLinejoin="round" />
    <path d="M70 430H210V310H390V150H530" stroke="var(--background)" strokeWidth="2" strokeDasharray="3 9" opacity=".65" />
    <g data-path-node><circle cx="70" cy="430" r="13" fill="var(--background)" /><circle cx="70" cy="430" r="5" fill="currentColor" /></g>
    <g data-path-node><circle cx="210" cy="310" r="13" fill="var(--background)" /><circle cx="210" cy="310" r="5" fill="currentColor" /></g>
    <g data-path-node><circle cx="390" cy="150" r="13" fill="var(--background)" /><circle cx="390" cy="150" r="5" fill="currentColor" /></g>
    <path d="m512 130 20 20-20 20" stroke="var(--background)" strokeWidth="3" />
    {!compact && <g fill="currentColor" fontFamily="inherit" fontSize="12" letterSpacing="2"><text x="48" y="492">01 / DISCOVER</text><text x="245" y="375">02 / APPLY</text><text x="375" y="95">03 / MOVE FORWARD</text></g>}
  </svg>;
}
