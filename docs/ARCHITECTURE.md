# ElectroTrack Architecture

## Role hierarchy

```
Admin
  └── Depo
        └── Distributor
              └── Sub Distributor
                    └── Retailer
```

**Creation rules:** Only Admin creates everyone; Depo creates Distributor; Distributor creates Sub Distributor; Sub Distributor creates Retailer.

**Shipment flow:** Depo → Distributor → Sub Distributor → Retailer (multi-product, single invoice per shipment).

## Collections (Firestore)

| Collection | Purpose |
|------------|---------|
| `users` | Auth profile, role, status, parentId, orgId |
| `organizations` | Branch entities (depos, distributors, sub_distributors, retailers) |
| `products` | Global SKU catalog |
| `stock` | orgId + productId → quantity |
| `shipments` | Header: sender/receiver/invoice/status; items embedded |
| `notifications` | Per-user shipment alerts |
| `transaction_history` | Immutable audit after receive |

Legacy collection names (`depos`, `distributors`, etc.) map to `organizations` with a `type` field for scalability.

## Shipment statuses

`pending` → `sent` → `in_transit` → `received` | `rejected`

On **Receive**: sender stock decreases, receiver stock increases, transaction logged, notification sent.

## Local development

Without Firebase env vars, data persists in `localStorage` via `lib/db/local-db.ts` and `lib/services/electrotrack.service.ts`.

## Firebase setup

Copy `.env.example` to `.env.local` and add Firebase project keys. The same service layer will switch to Firestore when configured (`lib/firebase/config.ts`).
