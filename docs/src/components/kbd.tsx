interface KbdProps {
  children: string
}

export function Kbd({ children }: KbdProps) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1.5 align-baseline font-mono text-[11px] font-medium text-text-secondary shadow-[0_1px_0_1px_var(--color-border)]">
      {children}
    </kbd>
  )
}
