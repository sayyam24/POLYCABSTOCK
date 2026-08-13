/**
 * Export local database to JSON file for migration to MongoDB Atlas
 * Run with: node scripts/export-local-db.js
 */

const fs = require('fs');
const path = require('path');

// Load the local database
const dbPath = path.join(__dirname, '..', '.mongo-data', 'local-db.json');

try {
  // Check if local database exists
  if (!fs.existsSync(dbPath)) {
    console.log('Local database file not found at:', dbPath);
    console.log('The application uses in-memory local database by default.');
    console.log('If you have data in the application, it may be stored in browser localStorage.');
    console.log('\nTo export browser data:');
    console.log('1. Open the application in browser');
    console.log('2. Open DevTools (F12)');
    console.log('3. Go to Application > Local Storage');
    console.log('4. Look for electrotrack keys and export manually');
    process.exit(0);
  }

  const dbData = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(dbData);

  // Export to JSON file
  const exportPath = path.join(__dirname, '..', 'local-db-export.json');
  fs.writeFileSync(exportPath, JSON.stringify(db, null, 2));

  console.log('✅ Local database exported to:', exportPath);
  console.log('\nDatabase statistics:');
  console.log('- Users:', db.users?.length || 0);
  console.log('- Organizations:', db.organizations?.length || 0);
  console.log('- Products:', db.products?.length || 0);
  console.log('- Stock records:', db.stock?.length || 0);
  console.log('- Shipments:', db.shipments?.length || 0);
  console.log('- Returns:', db.returns?.length || 0);
  console.log('- Transactions:', db.transactionHistory?.length || 0);
  console.log('- Retailer purchases:', db.retailerPurchases?.length || 0);
  console.log('- Stock ledger:', db.stockLedger?.length || 0);
  console.log('- Product aliases:', db.productAliases?.length || 0);
  console.log('- Bulk upload batches:', db.bulkUploadBatches?.length || 0);
  console.log('- Stock adjustments:', db.stockAdjustments?.length || 0);
  console.log('- Shipment shortages:', db.shipmentShortages?.length || 0);
  console.log('- Subscriptions:', db.subscriptions?.length || 0);
  console.log('- Payments:', db.payments?.length || 0);
  console.log('- Audit logs:', db.auditLogs?.length || 0);

} catch (error) {
  console.error('❌ Error exporting local database:', error.message);
  process.exit(1);
}
