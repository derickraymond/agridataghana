# AgriData Ghana

Agricultural data and marketplace platform for Ghana: farms and harvests, marketplace and orders, organisations,
commodity prices and advisories, batch traceability, admin portal and analyst analytics.

**Stack:** Next.js 15 (App Router), TypeScript, Tailwind v4, Supabase (Postgres, Auth, RLS).

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL and publishable key
npm run dev
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (do not run while `dev` is running) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |

## Environment variables

See [.env.example](./.env.example). Only `NEXT_PUBLIC_*` values reach the browser. Never put a service-role key in
frontend code or commit `.env*` files (they are git-ignored).

## Database

Migrations live in `supabase/migrations` and must be applied in filename order. See [docs/DATABASE.md](./docs/DATABASE.md).

## Deployment

Hosted on Netlify. See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for setup, rollback and maintenance, and
[docs/LAUNCH-CHECKLIST.md](./docs/LAUNCH-CHECKLIST.md) before going live.

## Not yet built

Real payment gateway (Paystack/Hubtel), cooperative inventory and member reports, exporter shipment documents, PDF reports.
