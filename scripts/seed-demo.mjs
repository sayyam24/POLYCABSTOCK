/**
 * CLI helper — run demo generation in browser via Admin → User Management,
 * or import generateDemoDataset from lib/demo/generator in a Node script with Firebase Admin.
 *
 * Usage (documentation):
 *   1. Open app as Admin → User Management → "Generate Demo Data"
 *   2. Or set NEXT_PUBLIC_AUTO_DEMO=true for first-visit auto seed (local)
 */

console.log(`
ElectroTrack Demo Seeder
========================
Use the in-app "Generate Demo Data" button (Admin → User Management).

Generated scale:
  - 3 Depos
  - 10 Distributors
  - 20 Sub Distributors
  - 50 Retailers
  - 14 products, opening stock, shipments, notifications, transactions

Demo password for all accounts: Demo@2024
Emails: depo1@demo.electrotrack.com, distributor1@demo.electrotrack.com, etc.
`)
