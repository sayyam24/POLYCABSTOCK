'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { BulkInvoiceUpload } from '@/components/bulk-invoice-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'
import { toast } from 'sonner'

export default function SubDistributorSendPage() {
  const { session } = useAuth()
  const { refresh } = useStore()

  return (
    <DashboardLayout role="sub_distributor">
      <DashboardHeader title="Send to Retailers" />
      <main className="p-4 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Sub Distributor → Retailer (Bulk Invoice Upload)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload multiple retailer invoice PDFs (10-15 bills) at end of day for bulk stock deduction
            </p>
          </CardHeader>
          <CardContent>
            <BulkInvoiceUpload 
              onUploadComplete={async (results) => {
                console.log('Bulk upload complete:', results)
                // Refresh data after bulk upload
                await refresh()
                toast.success('Bulk upload completed. Stock has been deducted from your account.')
              }}
              maxFiles={15}
            />
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
