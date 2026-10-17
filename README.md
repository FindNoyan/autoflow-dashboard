# AutoFlow — Automation Dashboard

A dashboard UI for monitoring automated workflows — active/paused/failed
status, success rates, and a recent-runs activity feed. Built with
Next.js (App Router) and Tailwind CSS v4.

## Tech stack

- Next.js 16 (App Router)
- Tailwind CSS v4
- Supabase (Postgres + Auth, Step 1: schema + auth pages, dashboard still demo data)
- Space Grotesk, Inter, JetBrains Mono (Google Fonts)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view it locally.

The dashboard demo works with no env vars set. Login / signup need
Supabase configured (see Step 1 below).

## Step 1 — Supabase setup (Noyan)

Do this once. Never share keys in chat. Never commit `.env`.

1. **Create the project:** In Supabase, create a free project named `autoflow`.
2. **Run the schema:** Open Supabase Dashboard → SQL Editor → New query,
   paste the entire `supabase/schema.sql` file, and press Run. This creates
   `workflows`, `runs`, and `chat_messages` with Row Level Security so each
   user only sees their own rows. No demo seed data is inserted.
3. **Copy the keys:** In Supabase Dashboard → Settings → API, copy the
   Project URL and the `anon` public key.
4. **Paste into Vercel:** Vercel → Project → Settings → Environment
   Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key

   For local dev, copy `.env.example` to `.env.local` and fill in the same
   two values. `.env.local` is git-ignored.

Then open `/signup` to create an account, `/login` to sign in. The home
dashboard is still the public demo until Step 2 wires it to real data.

## Build

```bash
npm run build
```

## Deploy

Deploys directly to Vercel — connect the repo and it just works, no
extra config needed. Add the two Supabase env vars in Vercel before
testing login on the live site.
