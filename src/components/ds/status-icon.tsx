interface StatusIconProps {
  /** Status name — matches against known patterns (case-insensitive) */
  status: string | undefined | null
  /** Color for the icon. Falls back to var(--status-default) */
  color?: string
  /** Icon size in pixels. Default 14 */
  size?: number
  className?: string
}

/**
 * Simple filled circle status icon — color conveys the status.
 */
export function StatusIcon({ color, size = 14, className }: StatusIconProps) {
  const c = color || 'var(--status-default)'

  return (
    <svg width={size} height={size} viewBox='0 0 16 16' fill='none' className={className}>
      <circle cx='8' cy='8' r='6.5' stroke={c} strokeWidth='1.5' />
      <circle cx='8' cy='8' r='4' fill={c} />
    </svg>
  )
}
