export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="var(--text-primary)" />
      <circle cx="32" cy="32" r="15" fill="none" stroke="var(--background)" strokeWidth="3" />
      <ellipse cx="32" cy="32" rx="15" ry="6" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      <circle cx="32" cy="17" r="3.5" fill="var(--background)" />
    </svg>
  )
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <LogoMark />
      {!compact && <span className="brand__name">QuantumLearn <em>AI</em></span>}
    </span>
  )
}
