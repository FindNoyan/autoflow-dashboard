# AutoFlow — Automation Dashboard

A dashboard UI for monitoring automated workflows — active/paused/failed
status, success rates, and a recent-runs activity feed. Built with
Next.js (App Router) and Tailwind CSS v4.

## Tech stack

- Next.js 16 (App Router)
- Tailwind CSS v4
- Supabase (Postgres + Auth, Step 1: schema + auth pages, Step 2: dashboard reads real user data)
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

Then open `/signup` to create an account, `/login` to sign in.

## Step 2 — Real data

The dashboard reads from Supabase when a user is logged in, and shows
demo data otherwise:

- **Logged out (or Supabase not configured):** the public demo page is
  shown unchanged, with a "Demo data — log in to see your workflows"
  label. The page is NOT locked.
- **Logged in:** the dashboard shows THAT user's own workflows, runs,
  and stats from Supabase (RLS enforced — users never see each other's
  rows). Stats are computed from real data: total runs, success rate,
  time saved as an honest estimate (15 min per successful run), active
  workflows. With no runs, values are 0 — never faked.
- **Logged in, no data yet:** a friendly empty state with a
  "Load demo workflows" button. Clicking it inserts the 5 demo workflows
  + 4 runs into THAT user's account only. Nothing is auto-seeded.

How to test (live): log in → empty state → click "Load demo workflows"
→ real rows appear → refresh (rows persist) → log out (demo data +
label return).

## Step 3 — AI chatbot

A floating chat button at the bottom-right of the dashboard opens a
360px panel with three suggested questions ("Which workflow failed
most recently?", "What is my success rate?", "Which workflows are
paused?"), a typing state, and an error + retry state.

- **Logged in:** questions go to the server-only `/api/chat` route.
  The browser sends its Supabase access token, the route validates it,
  then loads only that user's workflows and runs through RLS and
  answers from those rows. The Gemini key (server env var
  `GEMINI_API_KEY`, never `NEXT_PUBLIC_`, never committed) is used
  when configured; without it, the three suggested questions are still
  answered deterministically from the user's real data, and other
  questions return a plain "AI unavailable" error instead of an
  invented answer. User + assistant messages are saved to
  `chat_messages` and reloaded when the panel opens.
- **Logged out:** answers are computed locally from the public demo
  data only, labelled "Demo data", and no request is sent anywhere.
  Visitors can never reach the AI route or see another user's data.

How to test (live): log in → click the chat button → ask a suggested
question → the answer must match your real rows → refresh (chat
history persists) → log out → the same question gives the labelled
demo answer. Add `GEMINI_API_KEY` in Vercel → Project → Settings →
Environment Variables for full AI answers to any question.

## Build

```bash
npm run build
```

## Deploy

Deploys directly to Vercel — connect the repo and it just works, no
extra config needed. Add the two Supabase env vars in Vercel before
testing login on the live site.
