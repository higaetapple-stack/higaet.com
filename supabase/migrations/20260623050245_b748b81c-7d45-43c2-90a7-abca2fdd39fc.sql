create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  request_id text not null,
  consumer text not null,
  logical_id text not null,
  provider text not null,
  model text not null,
  attempt smallint not null,
  outcome text not null check (outcome in ('success','fallback','error','budget_block','killed')),
  tokens_in integer,
  tokens_out integer,
  latency_ms integer,
  cost_usd numeric(10,6),
  error_code text
);

create index if not exists ai_usage_consumer_created_at_idx
  on public.ai_usage (consumer, created_at desc);
create index if not exists ai_usage_provider_created_at_idx
  on public.ai_usage (provider, created_at desc);
create index if not exists ai_usage_request_id_idx
  on public.ai_usage (request_id);

grant all on public.ai_usage to service_role;
-- Intentionally NO grant to anon/authenticated: telemetry is server-only.

alter table public.ai_usage enable row level security;

-- Deny-by-default for authenticated/anon (no policies = no access);
-- service_role bypasses RLS.
