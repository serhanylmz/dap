-- dap.cards — referrals
-- run once in Supabase SQL editor.

-- 10 referrals per card by default
alter table public.cards
  add column if not exists referrals_remaining integer not null default 10
    check (referrals_remaining >= 0);

create table if not exists public.referral_codes (
  code text primary key check (code ~ '^[a-z0-9]{12,32}$'),
  inviter_handle text not null check (inviter_handle ~ '^[a-z0-9-]{2,32}$'),
  used_by_handle text check (used_by_handle is null or used_by_handle ~ '^[a-z0-9-]{2,32}$'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists referral_codes_inviter_idx on public.referral_codes(inviter_handle);
create index if not exists referral_codes_unused_idx on public.referral_codes(used_at) where used_at is null;

alter table public.referral_codes enable row level security;
-- no public policies. all access via service role from the app.

-- back-fill any existing rows in case the column was added late
update public.cards set referrals_remaining = 10 where referrals_remaining is null;
