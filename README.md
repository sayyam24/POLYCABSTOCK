# ElectroTrack SaaS Dashboard

Supply chain ERP: **Depo → Distributor → Sub Distributor → Retailer**

## Demo logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@electrotrack.com | admin123 |
| Depo | depo@electrotrack.com | depo123 |
| Distributor | distributor@electrotrack.com | dist123 |
| Sub Distributor | subdistributor@electrotrack.com | sub123 |
| Retailer | retailer@electrotrack.com | retail123 |

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Firebase setup (required for cloud sync)

1. Add keys to `.env.local` (from Firebase Console → Project settings).
2. Enable **Authentication → Email/Password**.
3. Enable **Firestore** and **Storage**.

### Deploy security rules (fixes `permission-denied`)

**Option A — Firebase Console (recommended)**

1. [Firebase Console](https://console.firebase.google.com) → your project → **Firestore** → **Rules**
2. Paste the contents of `firestore.rules` from this repo
3. Click **Publish**
4. **Storage** → **Rules** → paste `storage.rules` → **Publish**

**Option B — CLI**

```bash
npm i -g firebase-tools
firebase login
firebase use YOUR_PROJECT_ID
firebase deploy --only firestore:rules,storage
```

### Demo data (no manual entry)

On first visit, the app **auto-generates** a full ERP dataset locally (83+ users, products, stock, shipments).

**Admin → User Management** (or Admin Dashboard):

- **Generate Demo Data** — builds 3 Depos, 10 Distributors, 20 Sub Distributors, 50 Retailers, products, stock, shipments, notifications
- **Reset Demo Data** — clears generated data

**Demo logins** (password for all: `Demo@2024`):

| Role | Email example |
|------|----------------|
| Depo | `depo1@demo.electrotrack.com` |
| Distributor | `distributor1@demo.electrotrack.com` |
| Sub Distributor | `sub1@demo.electrotrack.com` |
| Retailer | `retail1@demo.electrotrack.com` |

Sign in with **role auto-detect** on the login page.

### First login

1. Sign in as **Admin** (`admin@electrotrack.com` / `admin123`)
2. Click **Generate Demo Data** (syncs to Firestore if rules are deployed)
3. Test Depo → Distributor → Sub Distributor → Retailer flow

> Set `NEXT_PUBLIC_AUTO_DEMO=false` to disable auto-seed on startup.

## Workflow test

1. Login as **Depo** → Stock → upload opening stock (Fan 100, Light 50, Bulb 20)
2. Depo → **Send** → pick Distributor → INV001 → add products → send
3. Login as **Distributor** → **Receive** → confirm → stock updates
4. Distributor → create Sub Distributor → send shipment
5. Sub Distributor → receive → send to Retailer
6. Retailer → receive → confirm

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
