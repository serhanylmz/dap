-- dap.cards — lock down cards.email from public read access
--
-- The anon and authenticated roles can read every column EXCEPT email.
-- Service role keeps full access (admin queue needs emails).
-- Run once in Supabase SQL editor.

revoke select on table public.cards from anon, authenticated;

grant select (
  id,
  handle,
  name,
  voice,
  headline,
  building,
  ask,
  offer,
  event_tags,
  origin_city,
  origin_country,
  links,
  artifacts,
  photo_url,
  verified,
  referrals_remaining,
  created_at
) on table public.cards to anon, authenticated;

-- after this, public requests like
--   /rest/v1/cards?select=email&verified=eq.true
-- return a 400 / 403 instead of a list of email addresses.
