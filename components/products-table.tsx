import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Product, StockRecord } from '@/lib/types'

interface StockTableProps {
  rows: StockRecord[]
}

export function StockTable({ rows }: StockTableProps) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-b border-border/50">
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Product</TableHead>
            <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Quantity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0">
              <TableCell className="font-medium">{r.productName}</TableCell>
              <TableCell className="text-right font-semibold">{r.quantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface ProductsTableProps {
  products: Product[]
}

export function ProductsTable({ products }: ProductsTableProps) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-b border-border/50">
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">SKU</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Name</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Category</TableHead>
            <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id} className="hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0">
              <TableCell className="font-mono text-sm">{p.sku}</TableCell>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell><Badge variant="secondary" className="font-medium">{p.category}</Badge></TableCell>
              <TableCell className="text-right font-semibold">₹{p.unitPrice}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
