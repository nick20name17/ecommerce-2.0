import { Lightbulb, AlertTriangle, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type CalloutType = 'tip' | 'warning' | 'info'

interface CalloutProps {
  type: CalloutType
  title?: string
  children: React.ReactNode
}

const config: Record<CalloutType, { icon: LucideIcon; label: string; borderClass: string; bgClass: string; iconClass: string }> = {
  tip: {
    icon: Lightbulb,
    label: 'Tip',
    borderClass: 'border-l-tip',
    bgClass: 'bg-tip-bg',
    iconClass: 'text-tip',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    borderClass: 'border-l-warning',
    bgClass: 'bg-warning-bg',
    iconClass: 'text-warning',
  },
  info: {
    icon: Info,
    label: 'Info',
    borderClass: 'border-l-info',
    bgClass: 'bg-info-bg',
    iconClass: 'text-info',
  },
}

export function Callout({ type, title, children }: CalloutProps) {
  const { icon: Icon, label, borderClass, bgClass, iconClass } = config[type]

  return (
    <div className={`my-5 rounded-r-lg border-l-[3px] ${borderClass} ${bgClass} px-4 py-3.5`}>
      <div className="flex items-start gap-2.5">
        <Icon size={16} className={`mt-0.5 shrink-0 ${iconClass}`} />
        <div className="min-w-0 flex-1">
          {title ? (
            <p className="mb-1 text-sm font-semibold text-foreground">{title}</p>
          ) : (
            <p className="mb-1 text-sm font-semibold text-foreground">{label}</p>
          )}
          <div className="text-sm leading-relaxed text-text-secondary [&>p]:mb-0">{children}</div>
        </div>
      </div>
    </div>
  )
}
