-- dap.cards — friendships table + seed network
-- run once in Supabase SQL editor.

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_handle text not null check (requester_handle ~ '^[a-z0-9-]{2,32}$'),
  recipient_handle text not null check (recipient_handle ~ '^[a-z0-9-]{2,32}$'),
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (requester_handle, recipient_handle),
  check (requester_handle <> recipient_handle)
);

create index if not exists friendships_requester_idx on public.friendships(requester_handle);
create index if not exists friendships_recipient_idx on public.friendships(recipient_handle);
create index if not exists friendships_status_idx on public.friendships(status);

alter table public.friendships enable row level security;

-- public can read accepted edges so path discovery works without auth
drop policy if exists "anyone reads accepted friendships" on public.friendships;
create policy "anyone reads accepted friendships"
  on public.friendships for select
  using (status = 'accepted');

-- all writes + non-accepted reads are gated to the service role (app-layer auth)

-- seed a connected friendship graph across existing verified cards.
-- creates non-trivial paths for the BFS demo: e.g. serhan -> kiran-iyer -> jin-park
insert into public.friendships (requester_handle, recipient_handle, status, responded_at) values
  ('serhan', 'lina-koch',         'accepted', now()),
  ('serhan', 'kiran-iyer',        'accepted', now()),
  ('serhan', 'mateo-vela',        'accepted', now()),
  ('lina-koch', 'tamar-shemesh',  'accepted', now()),
  ('lina-koch', 'adaeze-okonkwo', 'accepted', now()),
  ('kiran-iyer', 'mateo-vela',    'accepted', now()),
  ('kiran-iyer', 'jin-park',      'accepted', now()),
  ('kiran-iyer', 'chima-eze',     'accepted', now()),
  ('mateo-vela', 'adaeze-okonkwo','accepted', now()),
  ('tamar-shemesh', 'yui-tanaka', 'accepted', now()),
  ('jin-park', 'yui-tanaka',      'accepted', now())
on conflict (requester_handle, recipient_handle) do nothing;
