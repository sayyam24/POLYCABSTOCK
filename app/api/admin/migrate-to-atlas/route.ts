import { NextResponse } from 'next/server'
import { loadDatabase } from '@/lib/db/local-db'
import { getMongoDb } from '@/lib/mongodb'
import { requireAdminAuth } from '@/lib/auth/admin-auth'

/**
 * Admin-only API route to migrate local database to MongoDB Atlas
 * POST /api/admin/migrate-to-atlas
 */
export async function POST(request: Request) {
  const session = {
    userId: request.headers.get('x-user-id'),
    role: request.headers.get('x-user-role'),
  }

  const authError = requireAdminAuth(session)
  if (authError) return authError

  try {
    // Load local database
    console.log('Loading local database...')
    const localDb = loadDatabase()
    
    console.log('Local database loaded with:')
    console.log('- Users:', localDb.users.length)
    console.log('- Organizations:', localDb.organizations.length)
    console.log('- Products:', localDb.products.length)
    console.log('- Stock records:', localDb.stock.length)
    
    // Connect to Atlas
    console.log('Connecting to MongoDB Atlas...')
    const db = await getMongoDb()
    
    // Store the entire state in app_state collection
    const appStateCollection = db.collection('app_state')
    
    const stateDoc = {
      _id: 'app_state',
      state: localDb,
      updatedAt: new Date().toISOString(),
    }
    
    await appStateCollection.updateOne(
      { _id: 'app_state' } as any,
      { $set: stateDoc },
      { upsert: true }
    )
    
    console.log('App state migrated to app_state collection')
    
    // Also migrate users to separate users collection for authentication
    const usersCollection = db.collection('users')
    
    for (const user of localDb.users) {
      await usersCollection.updateOne(
        { email: user.email } as any,
        { $set: user },
        { upsert: true }
      )
    }
    
    console.log(`Migrated ${localDb.users.length} users to users collection`)
    
    // Verify the migration
    const appStateDoc = await db.collection('app_state').findOne({ _id: 'app_state' } as any)
    const usersCount = await db.collection('users').countDocuments()
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      statistics: {
        users: localDb.users.length,
        organizations: localDb.organizations.length,
        products: localDb.products.length,
        stock: localDb.stock.length,
        shipments: localDb.shipments.length,
        returns: localDb.returns.length,
        transactions: localDb.transactionHistory.length,
        retailerPurchases: localDb.retailerPurchases.length,
        stockLedger: localDb.stockLedger.length,
        productAliases: localDb.productAliases.length,
        bulkUploadBatches: localDb.bulkUploadBatches.length,
        stockAdjustments: localDb.stockAdjustments.length,
        shipmentShortages: localDb.shipmentShortages.length,
        subscriptions: localDb.subscriptions.length,
        payments: localDb.payments.length,
        auditLogs: localDb.auditLogs.length,
      },
      verification: {
        appStateExists: !!appStateDoc,
        usersInAtlas: usersCount,
      },
      nextSteps: [
        'Verify .env.local has NEXT_PUBLIC_DATA_BACKEND=mongo',
        'Restart the Next.js application',
        'Test login and other features',
        'If everything works, you can backup and remove .mongo-data directory',
      ],
    })
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
