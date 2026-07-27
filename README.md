# Together

A private couples planning app for shared tasks, decisions, goals, and financial targets.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, RLS) — migrations included
- Demo data adapter for local/Vercel without credentials
- React Hook Form + Zod
- Vitest + Playwright

## Quick start (demo mode)

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo accounts:

- `trevor@together.app` / `together123`
- `chanda@together.app` / `together123`

## Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Demo mode is the default. To prepare for Supabase:

1. Create a Supabase project
2. Run `supabase/migrations/20260516000000_init.sql`
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Set `USE_SUPABASE=true` once a live Supabase repository implementation is wired

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Local development |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript |
| `pnpm test` | Unit tests |
| `pnpm test:e2e` | Playwright flows |

## Deploy on Vercel

1. Push this repo to GitHub (`ProdjexTrevor/together`)
2. Import the project in [Vercel](https://vercel.com/new)
3. Framework preset: **Next.js**
4. Deploy (demo mode works with zero env vars)
5. Later: add Supabase env vars for production data

### Manual checklist

- [ ] Connect GitHub repo in Vercel
- [ ] Confirm build succeeds
- [ ] (Optional) Create Supabase project and apply migration
- [ ] (Optional) Enable email auth + magic links in Supabase
- [ ] (Optional) Configure Storage bucket for attachments
- [ ] (Optional) Set custom domain

## Architecture

```
src/
  app/                 routes (auth + authenticated screens)
  components/          UI, layout, create flow, comments, items
  lib/                 money, dates, progress, validation
  services/
    demo/              in-memory seeded adapter (Trevor & Chanda)
    actions.ts         server actions
    index.ts           repository factory
supabase/migrations/   schema + RLS
```

Business logic lives in the service/repository layer. UI components call server actions.

## Design

Visual direction follows `CURSOR_PROMPT.md` and `design-references/`:

- Warm cream page background
- Fraunces + Manrope
- Clay primary actions, sage progress, soft ivory cards
