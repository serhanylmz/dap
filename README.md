# dap.cards

an opt-in pre-arrival network for builders heading to san francisco events.

drop your card. browse the directory. generate a grounded AI cold-intro to anyone on it. add each other as friends — the resulting graph powers BFS intro-path discovery.

live at **https://dap.cards**.

## the centerpiece

a four-agent compound pipeline at `/api/intro`:

| stage | model | job |
|---|---|---|
| **extract** | Claude Haiku 4.5 | structured interests from visitor input (Anthropic tool-forcing → guaranteed schema match) |
| **retrieve** | BM25 (local) | top-k chunks from the target's verified bio corpus |
| **search** | Sonnet 4.6 + `web_search_20250305` | recent public findings about the target |
| **draft** | Sonnet 4.6 | grounded intro, streamed token-by-token, in the target's voice; prompt-cached system + voice samples |
| **judge** | Sonnet 4.6 | rubric verdict (no platitudes, no hallucination); one revise pass on fail |

design calls worth surfacing:

- **BM25 over embeddings** at this corpus size — embedding rerank is the v2 if quality stalls, not the v1
- **Anthropic tool-forcing** on Extract + Judge so the SDK guarantees schema-matched outputs (no JSON-parsing fragility)
- **Prompt-cached** system + voice samples in the Drafter (`cache_control: ephemeral`)
- **Soft judge** — passes/fails only on grounding + platitudes; specificity is a 0–10 score, not a gate
- **Friend graph + BFS** for intro-path discovery; path is passed to the Drafter as optional context
- **Column-level Postgres grants** on `cards.email` so the anon key can't enumerate emails

## features

- **directory** — every approved card at `/all`, compact rows with file numbers
- **per-card pages** at `/[handle]` — full dossier view with intro generator targeted at that card
- **briefing room** at `/intro` (auth-walled) — source card auto-loaded; pick target; optional notes
- **inbox** — friend requests, approve/reject; confirmed contacts route to one-click intro
- **referrals** — 10 invite links per member (∞ for admins). recipients skip manual review
- **admin** — review queue at `/admin`, gated by `ADMIN_EMAILS`
- **photo upload** — 4:5 portraits via Supabase Storage, hover-on-avatar to upload
- **magic-link auth** — Supabase OTP. unrecognized emails route to `/join`

## stack

- Next.js 16 (App Router) + Tailwind 4
- Supabase (Postgres + auth + storage + RLS + column grants)
- Anthropic SDK (Sonnet 4.6, Haiku 4.5, `web_search_20250305` tool)
- Vercel (Node runtime, SSE streaming)

## local dev

```bash
git clone https://github.com/serhanylmz/dap
cd dap
npm install
cp .env.example .env.local
# fill in the env values (see below)
npm run dev
```

open http://localhost:3000.

### env

| key | required for | source |
|---|---|---|
| `ANTHROPIC_API_KEY` | the intro pipeline | console.anthropic.com |
| `NEXT_PUBLIC_SUPABASE_URL` | everything | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client reads | Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | server writes + admin reads | Supabase project settings |
| `ADMIN_EMAILS` | `/admin` access + static-profile ownership | comma-separated list |
| `STATIC_OWNER_HANDLE` | which handle the admin emails own | e.g. `serhan` |

without `ANTHROPIC_API_KEY` the home page still renders; `/api/intro` returns a clean 503. without Supabase, `/join` returns 503 and `/all` shows the gated state.

## supabase setup

run the SQL files in `supabase/` in order in the Supabase SQL editor:

| file | what it does |
|---|---|
| `schema.sql` | `cards` table + RLS |
| `seed.sql` | (optional) 8 placeholder cards to fill the directory |
| `0002_friendships.sql` | `friendships` table + seeded edges for the BFS demo |
| `0003_referrals.sql` | `referrals_remaining` column + `referral_codes` table |
| `0004_photos.sql` | `photo_url` column + public `avatars` storage bucket |
| `0005_lock_email.sql` | column-level grants — locks down `cards.email` from anon reads |

After the photos migration, configure Supabase **Auth → URL Configuration**:

- Site URL: your deployed URL
- Redirect URLs: `<site>/auth/callback` (+ `http://localhost:3000/auth/callback` for dev)

For email deliverability with a custom sender, plug Resend (or any SMTP) into Auth → SMTP Settings.

## file map

```
src/
  app/
    page.tsx                  # home — hero, intro generator, directory grid
    layout.tsx                # fonts (geist + fraunces) + globals
    globals.css               # tailwind 4 @theme tokens
    [handle]/page.tsx         # dynamic card pages
    all/page.tsx              # the registry
    intro/page.tsx            # auth-walled briefing room
    inbox/page.tsx            # friend requests
    referrals/page.tsx        # invite codes
    profile/page.tsx          # edit your card + upload photo
    admin/page.tsx            # admin review queue
    join/page.tsx             # opt-in form (with optional ?ref=)
    login/page.tsx            # magic-link auth
    auth/callback/route.ts    # OTP exchange
    api/
      intro/route.ts          # SSE — anonymous mode (name + work + target)
      intro/authed/route.ts   # SSE — authed mode (source from session)
      cards/route.ts          # POST — submit a card
      friends/route.ts        # POST — send friend request
      friends/respond/route.ts# POST — accept / reject
      profile/route.ts        # PATCH — edit own card
      profile/photo/route.ts  # POST — upload portrait
      referrals/route.ts      # GET/POST — list + generate codes
      admin/approve/route.ts  # POST — admin only
      admin/reject/route.ts   # POST — admin only
      auth/precheck/route.ts  # POST — email → hasCard (gates magic-link)
  components/                  # CardView, Avatar, AppNav, ColdIntro, IntroAuthed,
                               # ProfileEditor, JoinForm, LoginForm, TargetPicker,
                               # ReferralsPanel, InboxActions, AdminActions, IntroButton
  lib/
    types.ts                  # Card, CorpusChunk, Profile, ExtractedInterests, JudgeVerdict
    session.ts                # server-side session resolver (used by every page)
    file-number.ts            # FNV-1a hash → stable № 0xxx per handle
    synthesize.ts             # Card → Profile (for cards without a hand-crafted corpus)
    supabase.ts               # public + service-role clients
    supabase-server.ts        # ssr server client (cookies)
    supabase-browser.ts       # ssr browser client
    db/
      cards.ts                # card queries + isAdmin + getCardForUser + upsertOwnCard
      friends.ts              # friendships + BFS path
      referrals.ts            # generate / consume / list codes
    agents/
      extract.ts              # A — Haiku, tool-forced JSON
      retrieve.ts             # B — BM25 over local corpus
      search.ts               # B' — Anthropic web_search tool
      draft.ts                # C — Sonnet, streaming, voice-cached
      judge.ts                # D — Sonnet, tool-forced verdict, soft rubric
  data/
    serhan.ts                 # static profile that seeds the directory
supabase/                     # SQL migrations
```

## deploy

```bash
npx vercel deploy --prod
```

set all env vars in **Vercel → Project → Settings → Environment Variables**.

## license

MIT.
