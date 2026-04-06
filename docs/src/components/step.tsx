interface StepProps {
  number: number
  title: string
  children: React.ReactNode
}

interface StepsProps {
  children: React.ReactNode
}

export function Steps({ children }: StepsProps) {
  return <div className="my-6 flex flex-col">{children}</div>
}

export function Step({ number, title, children }: StepProps) {
  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      {/* Vertical connector line */}
      <div className="absolute top-10 bottom-0 left-[15px] w-px bg-border last:hidden" />

      {/* Numbered circle */}
      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-background text-xs font-bold text-accent">
        {number}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pt-0.5">
        <h4 className="mb-1.5 text-sm font-semibold text-foreground">{title}</h4>
        <div className="text-sm leading-relaxed text-text-secondary [&>p]:mb-2 [&>p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  )
}
