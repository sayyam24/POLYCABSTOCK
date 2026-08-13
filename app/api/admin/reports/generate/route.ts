import { NextResponse } from 'next/server'
import { loadServerState } from '@/lib/db/server-state'
import { requireAdminAuth } from '@/lib/auth/admin-auth'

export async function POST(request: Request) {
  const session = {
    userId: request.headers.get('x-user-id'),
    role: request.headers.get('x-user-role'),
  }

  const authError = requireAdminAuth(session)
  if (authError) return authError

  try {
    const { type, orgId, dateRange } = await request.json()
    const state = await loadServerState()

    let data: any[] = []
    let headers: string[] = []

    const filterByDate = (item: any) => {
      if (dateRange === 'all') return true
      const itemDate = new Date(item.createdAt || item.dateTime || item.uploadDate || item.paymentDate)
      const days = parseInt(dateRange)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      return itemDate >= cutoff
    }

    const filterByOrg = (item: any) => {
      if (!orgId || orgId === 'all') return true
      return item.orgId === orgId
    }

    switch (type) {
      case 'stock':
        data = state.stock.filter(s => filterByOrg(s))
        headers = ['Product', 'Organization', 'Type', 'Quantity', 'Last Updated']
        data = data.map(s => [
          s.productName,
          state.organizations.find(o => o.id === s.orgId)?.name || 'Unknown',
          s.orgType,
          s.quantity,
          new Date(s.updatedAt).toLocaleDateString()
        ])
        break

      case 'shipments':
        data = state.shipments.filter(s => filterByDate(s) && (filterByOrg(s) || s.receiverOrgId === orgId))
        headers = ['Shipment #', 'Invoice #', 'From', 'To', 'Status', 'Items', 'Created']
        data = data.map(s => [
          s.shipmentNumber,
          s.invoiceNumber,
          state.organizations.find(o => o.id === s.senderOrgId)?.name || 'Unknown',
          state.organizations.find(o => o.id === s.receiverOrgId)?.name || 'Unknown',
          s.status,
          s.items.length,
          new Date(s.createdAt).toLocaleDateString()
        ])
        break

      case 'invoices':
        data = state.bulkUploadBatches.filter(b => filterByDate(b))
        headers = ['Batch ID', 'Uploaded By', 'Date', 'Total', 'Success', 'Failed', 'Status']
        data = data.map(b => [
          b.batchId,
          b.uploadedByName,
          new Date(b.uploadDate).toLocaleDateString(),
          b.totalInvoices,
          b.successCount,
          b.failedCount,
          b.status
        ])
        break

      case 'ledger':
        data = state.stockLedger.filter(l => filterByDate(l) && filterByOrg(l))
        headers = ['Date', 'Product', 'Organization', 'User', 'Action', 'Qty In', 'Qty Out', 'Remarks']
        data = data.map(l => [
          new Date(l.dateTime).toLocaleDateString(),
          l.productName,
          state.organizations.find(o => o.id === l.orgId)?.name || 'Unknown',
          l.userName,
          l.actionType,
          l.quantityIn,
          l.quantityOut,
          l.remarks || ''
        ])
        break

      case 'users':
        data = state.users.filter(u => filterByOrg(u))
        headers = ['Name', 'Email', 'Role', 'Status', 'Organization', 'Location']
        data = data.map(u => [
          u.name,
          u.email,
          u.role,
          u.status,
          state.organizations.find(o => o.id === u.orgId)?.name || 'Unknown',
          u.location || ''
        ])
        break

      case 'payments':
        data = state.payments.filter(p => filterByDate(p) && filterByOrg(p))
        headers = ['Organization', 'Amount', 'Status', 'Payment Date', 'Method', 'Transaction ID']
        data = data.map(p => [
          state.organizations.find(o => o.id === p.orgId)?.name || 'Unknown',
          p.amount,
          p.status,
          new Date(p.paymentDate).toLocaleDateString(),
          p.paymentMethod,
          p.transactionId || ''
        ])
        break

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    const csvContent = [headers, ...data].map(row => row.join(',')).join('\n')
    
    return NextResponse.json({ csv: csvContent })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
