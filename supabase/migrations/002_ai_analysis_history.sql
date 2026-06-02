create table if not exists public.ai_analyses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method text not null check (method in ('scalping', 'smc', 'trend', 'breakout')),
  mode text not null check (mode in ('short-term', 'weekly')),
  pair text not null,
  timeframe text not null,
  notes text not null default '',
  bias text not null check (bias in ('buy', 'sell')),
  entry text not null,
  stop_loss text not null,
  take_profit text not null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.ai_analyses enable row level security;

create policy "Users can read own AI analyses"
  on public.ai_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own AI analyses"
  on public.ai_analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own AI analyses"
  on public.ai_analyses for delete
  using (auth.uid() = user_id);

create index if not exists ai_analyses_user_created_idx
  on public.ai_analyses (user_id, created_at desc);
