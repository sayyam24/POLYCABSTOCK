import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  completed: 'bg-success/10 text-success hover:bg-success/20',
  received: 'bg-success/10 text-success hover:bg-success/20',
  confirmed: 'bg-success/10 text-success hover:bg-success/20',
  delivered: 'bg-success/10 text-success hover:bg-success/20',
  sent: 'bg-primary/10 text-primary hover:bg-primary/20',
  in_transit: 'bg-warning/10 text-warning hover:bg-warning/20',
  pending: 'bg-muted text-muted-foreground',
  rejected: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  'awaiting-confirmation': 'bg-primary/10 text-primary hover:bg-primary/20',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn('capitalize', statusStyles[status] ?? statusStyles.pending)}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}
