import type { PayloadLog } from '@/api/payload-log/schema'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { DATE_FORMATS } from '@/constants/app'
import { formatResponseTime } from '@/helpers/formatters'
import { format } from 'date-fns'

interface PayloadLogDetailDialogProps {
  log: PayloadLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const METHOD_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  GET: 'secondary',
  POST: 'default',
  PATCH: 'outline',
  PUT: 'outline',
  DELETE: 'destructive'
}

function getStatusVariant(code: number): 'success' | 'destructive' | 'secondary' {
  if (code >= 200 && code < 300) return 'success'
  if (code >= 400) return 'destructive'
  return 'secondary'
}

function formatJson(obj: Record<string, unknown> | string | null): string {
  if (!obj) return 'null'

  if (typeof obj === 'string') {
    try {
      return JSON.stringify(JSON.parse(obj), null, 2)
    } catch {
      return obj
    }
  }

  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

export const PayloadLogDetailDialog = ({
  log,
  open,
  onOpenChange
}: PayloadLogDetailDialogProps) => {
  if (!log) return null

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='h-[90vh] sm:max-w-4xl!'>
        <DialogHeader>
          <DialogTitle>Payload Log #{log.id}</DialogTitle>
        </DialogHeader>

        <div className='h-full space-y-4 overflow-y-auto'>
          <div className='grid grid-cols-2 gap-4'>
            <DetailItem label='Project'>
              {log.project_name} (#{log.project_id})
            </DetailItem>
            <DetailItem label='Method'>
              <Badge
                variant={METHOD_VARIANT[log.method] ?? 'secondary'}
                className='font-mono text-[11px]'
              >
                {log.method}
              </Badge>
            </DetailItem>
            <DetailItem label='Entity'>{log.entity || '—'}</DetailItem>
            <DetailItem label='Key'>{log.key || '—'}</DetailItem>
            <DetailItem label='Status'>
              <Badge
                variant={getStatusVariant(log.status_code)}
                className='font-mono text-[11px]'
              >
                {log.status_code}
              </Badge>
            </DetailItem>
            <DetailItem label='Duration'>{formatResponseTime(log.duration_ms)}</DetailItem>
            <DetailItem label='Is Error'>
              <Badge variant={log.is_error ? 'destructive' : 'success'}>
                {log.is_error ? 'Yes' : 'No'}
              </Badge>
            </DetailItem>
            <DetailItem label='Created At'>
              {log.created_at
                ? format(new Date(log.created_at), DATE_FORMATS.dateTime)
                : '—'}
            </DetailItem>
          </div>

          <div className='flex flex-col gap-1.5 overflow-hidden'>
            <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              URL
            </span>
            <div className='bg-muted rounded-md p-3 font-mono text-xs break-words'>{log.url}</div>
          </div>

          {log.error_message ? (
            <div className='flex flex-col gap-1.5 overflow-hidden'>
              <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                Error Message
              </span>
              <div className='rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'>
                <pre className='max-h-[200px] overflow-y-auto p-3 font-mono text-xs break-words whitespace-pre-wrap text-red-700 dark:text-red-300'>
                  {formatJson(log.error_message)}
                </pre>
              </div>
            </div>
          ) : null}

          <div className='flex flex-col gap-1.5 overflow-hidden'>
            <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              Payload
            </span>
            <div className='bg-muted rounded-md'>
              <pre className='max-h-[200px] overflow-y-auto p-3 font-mono text-xs break-words whitespace-pre-wrap'>
                {formatJson(log.payload)}
              </pre>
            </div>
          </div>

          <div className='flex flex-col gap-1.5 overflow-hidden'>
            <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              Response
            </span>
            <div className='bg-muted rounded-md'>
              <pre className='max-h-[200px] overflow-y-auto p-3 font-mono text-xs break-words whitespace-pre-wrap'>
                {formatJson(log.response)}
              </pre>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1'>
      <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
        {label}
      </span>
      <div className='text-sm'>{children}</div>
    </div>
  )
}
