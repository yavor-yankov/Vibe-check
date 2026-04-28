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

- `GROQ_API_KEY` — free from https://console.groq.com
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

### Auth — Allowed Redirect URLs (important if you have multiple Supabase projects)

If magic links redirect to the wrong app after clicking, it means Supabase is falling back to its default Site URL for a different project. Fix it in two steps:

1. **Set `NEXT_PUBLIC_APP_URL`** in `.env.local` (and in your Vercel/hosting env vars):
   ```
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app   # or http://localhost:3000 for dev
   ```

2. **Add the redirect URL to Supabase**: open *Authentication → URL Configuration* in your Supabase project dashboard and add this to the **Allowed Redirect URLs** list:
   ```
   https://your-app.vercel.app/auth/callback
   ```
   For local dev also add `http://localhost:3000/auth/callback`.

Without step 2, Supabase will ignore the `emailRedirectTo` parameter and fall back to the project's Site URL.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind 4 · Zod · Supabase (Postgres + Auth) · Groq (Llama 3.3 70B) · Tavily.

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md) for phased plan (backend + auth → Stripe + cost control → expanded analytics → retention loops → polish).
