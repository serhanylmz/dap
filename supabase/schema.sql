-- dap.cards schema
-- run this in the Supabase SQL editor (or `supabase db push` if using the CLI).
-- public can read verified cards. public can insert with verified=false (pending review).
-- service-role does everything else.

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  handle text unique not null check (handle ~ '^[a-z0-9-]{2,32}$'),
  name text not null check (char_length(name) between 1 and 80),
  voice text not null default 'casual' check (voice in ('casual', 'formal')),
  headline text not null check (char_length(headline) between 1 and 200),
  building text not null check (char_length(building) between 1 and 280),
  ask text not null check (char_length(ask) between 1 and 400),
  offer text not null check (char_length(offer) between 1 and 400),
  event_tags text[] not null default '{}',
  origin_city text not null check (char_length(origin_city) between 1 and 60),
  origin_country text not null check (char_length(origin_country) between 1 and 60),
  links jsonb not null default '[]',
  artifacts jsonb not null default '[]',
  email text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists cards_handle_idx on public.cards (handle);
create index if not exists cards_verified_idx on public.cards (verified);

alter table public.cards enable row level security;

drop policy if exists "anyone reads verified cards" on public.cards;
create policy "anyone reads verified cards"
  on public.cards for select
  using (verified = true);

drop policy if exists "anyone submits pending cards" on public.cards;
create policy "anyone submits pending cards"
  on public.cards for insert
  with check (verified = false);
