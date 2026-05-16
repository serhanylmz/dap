-- dap.cards — photos + avatars storage bucket
-- run once in Supabase SQL editor.

alter table public.cards add column if not exists photo_url text;

-- Public bucket, 5 MB cap, image types only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Anyone can read avatars (they're public profile photos)
drop policy if exists "avatars are publicly readable" on storage.objects;
create policy "avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- All writes go through the service role from our app code — no public write policy.
