-- AutoFlow — Step 1 database schema (Supabase / Postgres)
--
-- HOW TO RUN THIS (Noyan):
-- 1. In Supabase, create a project named `autoflow` (free tier).
-- 2. Open Supabase Dashboard -> SQL Editor -> New query.
-- 3. Paste this ENTIRE file in and press Run.
-- 4. Do NOT paste any secret key into chat or git. Copy URL + anon key
--    from Supabase Dashboard -> Settings -> API into Vercel env vars only.
--
-- NOTES:
-- - No demo seed data is inserted here on purpose. The dashboard demo data
--   stays frontend-only (app/data/dashboard.js) until Step 2 wires the
--   dashboard to these tables.
-- - Every table has Row Level Security (RLS) enabled. Each user can only
--   select / insert / update / delete rows where user_id = auth.uid(),
--   so users can never see each other's workflows, runs, or chats.

-- Workflows owned by one user.
create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  status text not null check (status in ('active', 'paused', 'failed')),
  last_run text,
  success_rate integer check (success_rate >= 0 and success_rate <= 100),
  created_at timestamptz not null default now()
);

-- Individual workflow runs. workflow_id is nullable so a run can be kept
-- even if its workflow is deleted; workflow_name is kept as a readable label.
create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workflow_id uuid references public.workflows (id) on delete set null,
  workflow_name text not null,
  time text,
  status text not null check (status in ('success', 'failed', 'running')),
  detail text,
  created_at timestamptz not null default now()
);

-- AI chat history (Step 3 will write here). role is user or assistant only.
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Indexes for per-user lookups.
create index if not exists workflows_user_id_idx on public.workflows (user_id);
create index if not exists runs_user_id_idx on public.runs (user_id);
create index if not exists chat_messages_user_id_idx on public.chat_messages (user_id);

-- Row Level Security: on for every table.
alter table public.workflows enable row level security;
alter table public.runs enable row level security;
alter table public.chat_messages enable row level security;

-- Workflows policies: users manage only their own rows.
create policy "Users can view own workflows"
  on public.workflows for select using (auth.uid() = user_id);
create policy "Users can insert own workflows"
  on public.workflows for insert with check (auth.uid() = user_id);
create policy "Users can update own workflows"
  on public.workflows for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own workflows"
  on public.workflows for delete using (auth.uid() = user_id);

-- Runs policies: users manage only their own rows.
create policy "Users can view own runs"
  on public.runs for select using (auth.uid() = user_id);
create policy "Users can insert own runs"
  on public.runs for insert with check (auth.uid() = user_id);
create policy "Users can update own runs"
  on public.runs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own runs"
  on public.runs for delete using (auth.uid() = user_id);

-- Chat messages policies: users manage only their own rows.
create policy "Users can view own chat messages"
  on public.chat_messages for select using (auth.uid() = user_id);
create policy "Users can insert own chat messages"
  on public.chat_messages for insert with check (auth.uid() = user_id);
create policy "Users can update own chat messages"
  on public.chat_messages for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own chat messages"
  on public.chat_messages for delete using (auth.uid() = user_id);
