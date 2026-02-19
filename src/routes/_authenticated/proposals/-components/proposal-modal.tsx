import type { Proposal, ProposalItem } from '@/api/proposal/schema'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getProposalStatusBadgeVariant,
  getProposalStatusLabel,
} from '@/constants/proposal'
import { formatCurrency, formatDate } from '@/helpers/formatters'
interface ProposalModalProps {
  proposal: Proposal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProposalModal({
  proposal,
  open,
  onOpenChange,
}: ProposalModalProps) {
  if (!proposal) return null

  const items: ProposalItem[] = proposal.items ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Proposal — {proposal.quote ?? '—'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-auto">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Customer</dt>
            <dd className="truncate font-medium" title={proposal.b_name}>
              {proposal.b_name ?? '—'}
            </dd>
            <dt className="text-muted-foreground">Date</dt>
            <dd>{formatDate(proposal.qt_date)}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <Badge variant={getProposalStatusBadgeVariant(proposal.status)}>
                {getProposalStatusLabel(proposal.status)}
              </Badge>
            </dd>
            <dt className="text-muted-foreground">Tax</dt>
            <dd>{formatCurrency(proposal.tax)}</dd>
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatCurrency(proposal.subtotal)}</dd>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-semibold">{formatCurrency(proposal.total)}</dd>
          </dl>

          {items.length > 0 && (
            <>
              <h3 className="text-muted-foreground text-sm font-medium">
                Line items
              </h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead className="w-[20%]">Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.autoid}>
                        <TableCell className="max-w-0 truncate" title={item.descr}>
                          {item.descr || '—'}
                        </TableCell>
                        <TableCell>{item.quan ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
