import { Send } from 'lucide-react'

import { InitialsAvatar } from '@/components/ds'
import { Textarea } from '@/components/ui/textarea'

const MOCK_COMMENTS = [
  {
    id: 1,
    author: 'Alex Morgan',
    text: 'Started working on this task. Will update once the first draft is ready.',
    time: '2 hours ago'
  },
  {
    id: 2,
    author: 'Jamie Chen',
    text: 'Looks good! Can we also add validation for the email field?',
    time: '1 hour ago'
  },
  {
    id: 3,
    author: 'Alex Morgan',
    text: "Good idea, I'll include that in the next update.",
    time: '45 min ago'
  }
]

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

export function TaskActivityPanel() {
  return (
    <div>
      {/* Section label */}
      <div className='mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
        Activity
      </div>

      {/* Feed */}
      <div className='flex flex-col gap-4 mb-4'>
        {MOCK_COMMENTS.map((c) => (
          <div key={c.id} className='flex gap-2.5'>
            <InitialsAvatar initials={getInitials(c.author)} size={24} />
            <div className='min-w-0 flex-1'>
              <div className='flex items-baseline gap-2'>
                <span className='text-xs font-semibold text-foreground'>{c.author}</span>
                <span className='text-[11px] text-text-tertiary'>{c.time}</span>
              </div>
              <p className='mt-0.5 text-[13px] leading-relaxed text-text-secondary'>{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Comment input */}
      <div className='relative'>
        <Textarea
          placeholder='Write a comment...'
          rows={2}
          disabled
          className='resize-none pr-10 text-[13px]'
        />
        <button
          type='button'
          disabled
          className='absolute right-1.5 bottom-1.5 inline-flex size-7 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover disabled:opacity-40'
        >
          <Send className='size-3.5' />
        </button>
      </div>
      <p className='mt-1.5 text-center text-[11px] text-text-tertiary'>
        Coming soon
      </p>
    </div>
  )
}
