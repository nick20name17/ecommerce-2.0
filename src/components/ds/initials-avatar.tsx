const AVATAR_COLORS = ['#007AFF', '#FF9500', '#34C759', '#FF3B30', '#AF52DE', '#5856D6']

interface InitialsAvatarProps {
  /** Two-letter initials (e.g. "JD") */
  initials: string
  /** Size in pixels. Default 24 */
  size?: number
  className?: string
}

/**
 * Deterministic color avatar per DESIGN_SYSTEM.md:
 * - Hash from charCode(0) + charCode(1) mod 6 into 6-color palette
 * - White text, fontSize = size * 0.42, fontWeight 600
 * - Common sizes: 16 (mobile inline), 18 (table row), 20 (detail field), 24 (default)
 */
export function InitialsAvatar({ initials, size = 24, className }: InitialsAvatarProps) {
  const hash = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)
  const bg = AVATAR_COLORS[hash % AVATAR_COLORS.length]

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: size * 0.42,
        fontWeight: 600,
        letterSpacing: '-0.02em',
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  )
}
