import { Play } from 'lucide-react'

interface VideoSlotProps {
  title?: string
  description?: string
}

export function VideoSlot({ title, description }: VideoSlotProps) {
  return (
    <div className="my-6 overflow-hidden rounded-xl border border-border">
      {/* 16:9 aspect ratio container */}
      <div className="relative flex aspect-video items-center justify-center bg-muted">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Play button and text */}
        <div className="relative flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors">
            <Play size={24} className="ml-0.5" fill="currentColor" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Video coming soon</p>
            {title && (
              <p className="mt-1 text-xs text-text-tertiary">{title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Description bar */}
      {description && (
        <div className="border-t border-border bg-muted/50 px-4 py-2.5">
          <p className="text-xs text-text-secondary">{description}</p>
        </div>
      )}
    </div>
  )
}
