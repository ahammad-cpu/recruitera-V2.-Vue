# Recruitera V2

Nuxt 4 + shadcn-vue rewrite of the Recruitera CRM.

## Stack
- Nuxt 4 (Vue 3, TypeScript)
- Tailwind CSS v4
- shadcn-vue components (in `app/components/ui`)
- Vue Query for server state
- Pinia for UI state
- MSW for mock API in dev
- VeeValidate + Zod for forms

## Getting started

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:3000`.

## Design system

All colors, spacing and reusable primitives live in:
- **Tokens**: `app/assets/css/main.css` — every `--brand-*` value. Change one, propagates everywhere.
- **Primitives**: `app/components/brand/` — `BrandButton`, `BrandSearchBar`, `BrandDataTable`, etc.

See [`app/components/brand/README.md`](app/components/brand/README.md) for the full inventory and usage rules.

## Mock API

MSW intercepts every request under `/api/*` in dev. Real handlers live in `app/mocks/handlers/`; every unhandled route falls through to a `[]` stub so pages don't 404 while you build them.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fahammad-cpu%2Frecruitera-V2.-Vue&project-name=recruitera-v2&repository-name=recruitera-v2)

One-time setup: click **Deploy**, authorize Vercel to access the repo, and confirm. Nuxt is auto-detected — no build config needed.

After the one-time import, deployment is fully automatic:
- Every push to `main` → production deploy
- Every push to any other branch → automatic preview URL
- Every PR gets a preview link commented by the Vercel bot

### Optional environment variables

Set these on the Vercel project only if / when a real backend exists (defaults in `nuxt.config.ts` work out of the box for the mock-only build):

| Key | Purpose |
|---|---|
| `NUXT_PUBLIC_API_BASE` | Public API host (client bundle) |
| `NUXT_PUBLIC_APP_ENV` | `production` / `staging` |
| `API_SECRET` | Server-only secret (never `NUXT_PUBLIC_*`) |
| `DATABASE_URL` | Server-only Postgres URL |
