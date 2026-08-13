/**
 * Migration script to transfer local database to MongoDB Atlas
 * Run with: node scripts/migrate-to-atlas.js
 * 
 * This script:
 * 1. Reads local database from .mongo-data/local-db.json (if exists)
 * 2. Connects to MongoDB Atlas using MONGODB_URI from .env.local
 * 3. Migrates all data to the 'electrotrack' database
 * 
 * Prerequisites:
 * - Node.js installed
 * - .env.local file with MONGODB_URI configured
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'electrotrack';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  console.error('Please add your MongoDB Atlas connection string to .env.local');
  process.exit(1);
}

console.log('🔄 Starting migration to MongoDB Atlas...');
console.log('📊 Database:', MONGODB_DB);
console.log('🔗 Connection:', MONGODB_URI.replace(/\/\/([^:]+):[^@]+@/, '//$1:****@'));

async function migrate() {
  let client;
  
  try {
    // Connect to Atlas
    console.log('\n📡 Connecting to MongoDB Atlas...');
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    });
    
    await client.connect();
    console.log('✅ Connected to Atlas');
    
    const db = client.db(MONGODB_DB);
    
    // Check if local database file exists
    const localDbPath = path.join(__dirname, '..', '.mongo-data', 'local-db.json');
    let localData = null;
    
    if (fs.existsSync(localDbPath)) {
      console.log('\n📂 Found local database file');
      const rawData = fs.readFileSync(localDbPath, 'utf8');
      localData = JSON.parse(rawData);
      console.log('✅ Local database loaded');
    } else {
      console.log('\n⚠️  No local database file found');
      console.log('The application uses in-memory local database by default.');
      console.log('If you have been using the app with MongoDB backend, data may already be in Atlas.');
    }
    
    // If we have local data, migrate it
    if (localData) {
      console.log('\n📦 Migrating data to Atlas...');
      
      // Store the entire state in app_state collection (as per the app's architecture)
      const appStateCollection = db.collection('app_state');
      
      const stateDoc = {
        _id: 'app_state',
        state: localData,
        updatedAt: new Date().toISOString(),
      };
      
      await appStateCollection.updateOne(
        { _id: 'app_state' },
        { $set: stateDoc },
        { upsert: true }
      );
      
      console.log('✅ App state migrated to app_state collection');
      
      // Also migrate users to separate users collection for authentication
      if (localData.users && localData.users.length > 0) {
        const usersCollection = db.collection('users');
        
        for (const user of localData.users) {
          await usersCollection.updateOne(
            { email: user.email },
            { $set: user },
            { upsert: true }
          );
        }
        
        console.log(`✅ Migrated ${localData.users.length} users to users collection`);
      }
      
      // Print statistics
      console.log('\n📊 Migration statistics:');
      console.log('- Users:', localData.users?.length || 0);
      console.log('- Organizations:', localData.organizations?.length || 0);
      console.log('- Products:', localData.products?.length || 0);
      console.log('- Stock records:', localData.stock?.length || 0);
      console.log('- Shipments:', localData.shipments?.length || 0);
      console.log('- Returns:', localData.returns?.length || 0);
      console.log('- Transactions:', localData.transactionHistory?.length || 0);
      console.log('- Retailer purchases:', localData.retailerPurchases?.length || 0);
      console.log('- Stock ledger:', localData.stockLedger?.length || 0);
      console.log('- Product aliases:', localData.productAliases?.length || 0);
      console.log('- Bulk upload batches:', localData.bulkUploadBatches?.length || 0);
      console.log('- Stock adjustments:', localData.stockAdjustments?.length || 0);
      console.log('- Shipment shortages:', localData.shipmentShortages?.length || 0);
      console.log('- Subscriptions:', localData.subscriptions?.length || 0);
      console.log('- Payments:', localData.payments?.length || 0);
      console.log('- Audit logs:', localData.auditLogs?.length || 0);
    } else {
      console.log('\n⚠️  No local data to migrate');
      console.log('If you have been using the app with MongoDB backend, check Atlas directly.');
    }
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const appStateDoc = await db.collection('app_state').findOne({ _id: 'app_state' });
    const usersCount = await db.collection('users').countDocuments();
    
    if (appStateDoc) {
      console.log('✅ app_state collection verified');
      console.log('   - State size:', JSON.stringify(appStateDoc.state).length, 'bytes');
    } else {
      console.log('⚠️  app_state collection is empty');
    }
    
    console.log('✅ users collection:', usersCount, 'documents');
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Verify .env.local has NEXT_PUBLIC_DATA_BACKEND=mongo');
    console.log('2. Restart the Next.js application');
    console.log('3. Test login and other features');
    console.log('4. If everything works, you can backup and remove .mongo-data directory');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Disconnected from Atlas');
    }
  }
}

migrate();
