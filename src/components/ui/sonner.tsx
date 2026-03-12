import { Check, CircleAlert, Info, Loader2, X } from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

import { useTheme } from '@/providers/theme'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group'
      icons={{
        success: <Check className='size-3.5' strokeWidth={2.5} />,
        info: <Info className='size-3.5' />,
        warning: <CircleAlert className='size-3.5' />,
        error: <X className='size-3.5' strokeWidth={2.5} />,
        loading: <Loader2 className='size-3.5 animate-spin' />
      }}
      style={
        {
          '--normal-bg': 'var(--background)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--border)',
          '--success-bg': 'var(--background)',
          '--success-text': 'var(--foreground)',
          '--success-border': 'var(--border)',
          '--error-bg': 'var(--background)',
          '--error-text': 'var(--foreground)',
          '--error-border': 'var(--border)',
          '--warning-bg': 'var(--background)',
          '--warning-text': 'var(--foreground)',
          '--warning-border': 'var(--border)',
          '--info-bg': 'var(--background)',
          '--info-text': 'var(--foreground)',
          '--info-border': 'var(--border)',
          '--border-radius': '8px',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'text-[13px] font-medium !shadow-lg',
          success: '[&_[data-icon]>svg]:text-emerald-500',
          error: '[&_[data-icon]>svg]:text-destructive',
          warning: '[&_[data-icon]>svg]:text-amber-500',
          info: '[&_[data-icon]>svg]:text-blue-500',
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
