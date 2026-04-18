# Vibe Check

Interview-style validator for app ideas. Walks you through a Socratic chat, scans the web for competitors, then returns a scored report + devil's advocate red-team pass.

## Getting started

```bash
pnpm install
cp .env.example .env.local      # fill in the keys — see below
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required env vars

See [`.env.example`](./.env.example) for the full list.

- `GEMINI_API_KEY` — free from https://aistudio.google.com/apikey
- `TAVILY_API_KEY` — free from https://app.tavily.com (1000 searches / mo)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — from https://supabase.com

## Supabase setup (Phase 1)

1. Create a new project at https://supabase.com/dashboard/new.
2. Copy the URL, anon key, and service_role key from *Project Settings → API* into `.env.local`.
3. Run the initial migration: open *SQL Editor* in the Supabase dashboard and paste the contents of [`supabase/migrations/0001_initial_schema.sql`](./supabase/migrations/0001_initial_schema.sql). Or, with the Supabase CLI linked:

   ```bash
   pnpm dlx supabase db push
   ```

The schema creates `users`, `sessions`, `messages`, `competitors`, `reports`, and `red_team_reports` with RLS enabled — a user can only see their own rows.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind 4 · Zod · Supabase (Postgres + Auth) · Google Gemini · Tavily.

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md) for phased plan (backend + auth → Stripe + cost control → expanded analytics → retention loops → polish).
