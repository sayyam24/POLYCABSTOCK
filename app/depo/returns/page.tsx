'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { ReturnGoodsView } from '@/components/return-goods-view'

export default function DepoReturnsPage() {
  return (
    <DashboardLayout role="depo">
      <DashboardHeader title="Return goods" />
      <main className="p-4 lg:p-8">
        <ReturnGoodsView />
      </main>
    </DashboardLayout>
  )
}
