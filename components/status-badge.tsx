import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle2, Clock, XCircle, Truck, Package, AlertCircle } from 'lucide-react'

const statusStyles: Record<string, { className: string; icon: any }> = {
  completed: { className: 'bg-success/10 text-success border-success/20 hover:bg-success/20', icon: CheckCircle2 },
  received: { className: 'bg-success/10 text-success border-success/20 hover:bg-success/20', icon: CheckCircle2 },
  confirmed: { className: 'bg-success/10 text-success border-success/20 hover:bg-success/20', icon: CheckCircle2 },
  delivered: { className: 'bg-success/10 text-success border-success/20 hover:bg-success/20', icon: CheckCircle2 },
  sent: { className: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20', icon: Package },
  in_transit: { className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20', icon: Truck },
  pending: { className: 'bg-muted text-muted-foreground border-border/50 hover:bg-muted/80', icon: Clock },
  rejected: { className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20', icon: XCircle },
  'awaiting-confirmation': { className: 'bg-info/10 text-info border-info/20 hover:bg-info/20', icon: AlertCircle },
}

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? statusStyles.pending
  const Icon = style.icon

  return (
    <Badge className={cn('capitalize font-medium px-2.5 py-1 gap-1.5', style.className)}>
      <Icon className="h-3 w-3" />
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}
