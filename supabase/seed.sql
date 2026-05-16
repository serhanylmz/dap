-- dap.cards seed: 8 diverse placeholder builders.
-- These are fictional. Inserted as verified=true so they appear on /all.
-- Edit or delete via the Supabase Table Editor.

insert into public.cards (
  handle, name, voice, headline, building, ask, offer,
  event_tags, origin_city, origin_country, links, artifacts, email, verified
) values

-- 1. AI safety researcher, Berlin
(
  'lina-koch', 'Lina Koch', 'casual',
  'phd-ing at mpi-tübingen. trying to keep the alignment people from yelling at the capabilities people in the same conference room.',
  'small evals harness for mechanistic interpretability — measuring how much of a model''s behavior can be attributed to specific circuits without confabulating.',
  'anyone running circuit-level evals in production. also: people who''ve found a way to publish negative results without their advisor sighing.',
  'i have a working mech interp setup for any open-weights model up to ~7B params. happy to share the recipe.',
  array['NeurIPS SF satellite', 'In SF, any week']::text[],
  'Berlin', 'Germany',
  '[]'::jsonb,
  '[{"detail": "open-source circuit-eval framework, ~1.4k stars on github"}, {"detail": "phd candidate at MPI-Tübingen, advisor in mech interp"}]'::jsonb,
  'seed+lina-koch@dap.cards', true
),

-- 2. Biotech / protein-design post-doc, Cambridge UK
(
  'adaeze-okonkwo', 'Adaeze Okonkwo', 'casual',
  'post-doc at the crick. spinning out a protein-design startup that''s still mostly a notion doc and a sense of dread.',
  'small-molecule binder design pipeline using diffusion models conditioned on disease pathway graphs. preclinical only — no humans yet.',
  'anyone who''s gone post-doc → founder recently. specifically: how did you pry the IP loose from your institution.',
  'i can read the methods section of any biophysics paper from 2018 onward and tell you in three minutes whether it''d actually work in vitro.',
  array['SS26 SF', 'In SF, any week']::text[],
  'Cambridge', 'United Kingdom',
  '[]'::jsonb,
  '[{"detail": "postdoc at the Francis Crick Institute"}, {"detail": "co-author on 4 protein-design papers, 2023-2025"}]'::jsonb,
  'seed+adaeze-okonkwo@dap.cards', true
),

-- 3. Voice/agent product engineer, Bangalore
(
  'kiran-iyer', 'Kiran Iyer', 'casual',
  'third engineer at a yc s24 voice agent company. mostly debugging twilio at 2am.',
  'real-time voice agent infrastructure for outbound sales. latency-budget management when the LLM, the TTS, and the dialer all want to be the bottleneck.',
  'anyone solving barge-in detection on noisy phone lines without a custom DSP layer. also: people running large-scale voice evals.',
  'war stories. specifically, 14 things twilio doesn''t tell you about call-transfer that will silently break in production.',
  array['SS26 SF', 'AI Engineer Summit']::text[],
  'Bangalore', 'India',
  '[]'::jsonb,
  '[{"detail": "3rd engineer at a YC S24 voice-infra startup"}, {"detail": "shipped voice agents to >1M calls in production"}]'::jsonb,
  'seed+kiran-iyer@dap.cards', true
),

-- 4. Designer with developer-tools side project, Tokyo
(
  'yui-tanaka', 'Yui Tanaka', 'casual',
  'product designer at a tokyo bank. moonlighting on a developer-tooling side project that may finally be ready to leave the notion doc.',
  'a markdown-first knowledge tool for engineering teams. think obsidian for the team layer — links across people''s notes, not just files.',
  'anyone running internal docs for an engineering org of 20-200. what actually got used, what got abandoned.',
  'design-engineering reviews. if you have a side project and you can''t tell why the landing page doesn''t convert, i can probably spot it.',
  array['In SF, any week', 'Manifest 26']::text[],
  'Tokyo', 'Japan',
  '[]'::jsonb,
  '[{"detail": "lead product designer for a 600-engineer org"}, {"detail": "side project: ~800 weekly active users, mostly word-of-mouth"}]'::jsonb,
  'seed+yui-tanaka@dap.cards', true
),

-- 5. Climate hardware founder, Mexico City
(
  'mateo-vela', 'Mateo Vela', 'casual',
  'climate hardware founder. former mech-e at apple. trying to make industrial heat pumps cheap enough that latam factories stop burning diesel.',
  'a modular high-temperature heat pump (200°C output) for industrial process heat. third prototype is in a são paulo brewery and so far hasn''t caught fire.',
  'anyone with industrial sales experience in latam. also: people who''ve raised hardware seed rounds without giving up half the company.',
  'thermal systems design. if you''re working on heat management, batteries, or dense compute cooling, i probably have an opinion.',
  array['SS26 SF', 'In SF, any week']::text[],
  'Mexico City', 'Mexico',
  '[]'::jsonb,
  '[{"detail": "former mech-e on Apple''s M-series thermal team"}, {"detail": "$2.4M seed round, hardware-focused lead investor (2025)"}]'::jsonb,
  'seed+mateo-vela@dap.cards', true
),

-- 6. Agent eval researcher, Tel Aviv
(
  'tamar-shemesh', 'Tamar Shemesh', 'casual',
  'ms student at the technion. spending way too much time on benchmark contamination problems.',
  'an open eval benchmark for agentic web tasks where the agent operates against a constantly-changing simulated environment — designed to be very hard to contaminate.',
  'anyone running agent evals on real production traffic. and: people who''ve cared enough about benchmark integrity to actually rotate test sets.',
  'i''ll run your agent on my benchmark for free and send you a detailed failure breakdown. fair warning: most agents fail at the multi-step planning stage.',
  array['NeurIPS SF satellite', 'AI Engineer Summit']::text[],
  'Tel Aviv', 'Israel',
  '[]'::jsonb,
  '[{"detail": "ms candidate at the Technion, advisor in NLP + evals"}, {"detail": "open benchmark for agentic web tasks, ~30 teams in early access"}]'::jsonb,
  'seed+tamar-shemesh@dap.cards', true
),

-- 7. Infrastructure builder, Lagos
(
  'chima-eze', 'Chima Eze', 'casual',
  'senior infra at a lagos fintech. founding member of a small lagos devtools collective.',
  'a kafka-alternative streaming layer optimized for spotty internet — built for fintech use cases in africa where the assumption of "always-connected" breaks down.',
  'anyone running event-driven architectures in regions with real packet loss. also: people who''ve sold infra to enterprises in emerging markets.',
  'i can walk you through what actually breaks at the network layer below 100ms reliability. free debugging session if your kafka cluster is misbehaving.',
  array['In SF, any week']::text[],
  'Lagos', 'Nigeria',
  '[]'::jsonb,
  '[{"detail": "senior infra at a YC S23 African fintech"}, {"detail": "co-founder of a lagos devtools collective"}]'::jsonb,
  'seed+chima-eze@dap.cards', true
),

-- 8. Robot learning, Seoul
(
  'jin-park', 'Jin Park', 'casual',
  'post-phd, hopping out of the lab. building a robot foundation-model startup that''s mostly waiting for ai chips to land in seoul.',
  'a manipulation policy foundation model trained on a few million teleoperated demonstrations. open weights for the small model, hosted for the large one.',
  'anyone training large robotics models on >100 gpus. and: people who''ve thought carefully about teleoperation cost curves.',
  'i''ll trade compute knowledge for application knowledge. specifically: what robotic tasks actually have product-market fit in 2026.',
  array['SS26 SF']::text[],
  'Seoul', 'South Korea',
  '[]'::jsonb,
  '[{"detail": "PhD in robot learning, KAIST, 2024"}, {"detail": "co-founded a robot-learning startup (seed, 2025)"}]'::jsonb,
  'seed+jin-park@dap.cards', true
);
