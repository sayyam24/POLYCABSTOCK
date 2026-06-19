'use client'

import type { Shipment } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { FileText, CheckCircle2, XCircle } from 'lucide-react'

interface ShipmentReceiveCardProps {
  shipment: Shipment
  onReceive: (id: string) => void
  onReject?: (id: string) => void
}

export function ShipmentReceiveCard({
  shipment,
  onReceive,
  onReject,
}: ShipmentReceiveCardProps) {
  const canAct = shipment.status === 'sent' || shipment.status === 'in_transit'

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">
              {shipment.invoiceNumber} — {shipment.shipmentNumber}
            </CardTitle>
            <CardDescription>
              From {shipment.senderName} · {new Date(shipment.createdAt).toLocaleString()}
            </CardDescription>
          </div>
          <StatusBadge status={shipment.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium">Shipment contents:</p>
          <ul className="space-y-1">
            {shipment.items.map((item, i) => (
              <li key={i} className="text-sm">
                <span className="font-semibold">{item.quantity}</span> × {item.productName}
                {item.notes && (
                  <span className="text-muted-foreground"> — {item.notes}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {shipment.invoiceFileName && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            Invoice: {shipment.invoiceFileName}
            {shipment.invoiceStorageUrl && (
              <a
                href={shipment.invoiceStorageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                View file
              </a>
            )}
            {shipment.invoiceDataUrl?.startsWith('data:image') && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shipment.invoiceDataUrl}
                alt="Invoice preview"
                className="h-16 rounded border object-cover"
              />
            )}
          </div>
        )}

        {shipment.notes && (
          <p className="text-sm text-muted-foreground">Note: {shipment.notes}</p>
        )}

        {canAct && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              size="lg"
              className="h-12 flex-1"
              onClick={() => onReceive(shipment.id)}
            >
              <CheckCircle2 className="mr-2 h-5 w-5" /> Receive Shipment
            </Button>
            {onReject && (
              <Button
                size="lg"
                variant="outline"
                className="h-12 flex-1"
                onClick={() => onReject(shipment.id)}
              >
                <XCircle className="mr-2 h-5 w-5" /> Reject
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
