create table if not exists public.system_errors (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  source text not null check (source in ('client','server_fn','api_route','background','realtime','auth')),
  level text not null default 'error' check (level in ('warning','error','fatal')),
  message text not null,
  name text,
  stack text,
  release text,
  environment text,
  url text,
  user_id uuid references auth.users(id) on delete set null,
  user_role text,
  route text,
  trace_id text,
  fingerprint text,
  context jsonb not null default '{}'::jsonb,
  user_agent text
);

create index if not exists system_errors_occurred_at_idx on public.system_errors (occurred_at desc);
create index if not exists system_errors_source_idx on public.system_errors (source, occurred_at desc);
create index if not exists system_errors_fingerprint_idx on public.system_errors (fingerprint);

grant select, insert on public.system_errors to authenticated;
grant all on public.system_errors to service_role;

alter table public.system_errors enable row level security;

create policy "users insert own client errors"
  on public.system_errors for insert to authenticated
  with check (auth.uid() = user_id or user_id is null);

create policy "admins read all errors"
  on public.system_errors for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'super_admin'));

create table if not exists public.system_metrics (
  id uuid primary key default gen_random_uuid(),
  recorded_at timestamptz not null default now(),
  kind text not null check (kind in ('route','server_fn','api_route','query','ai')),
  name text not null,
  duration_ms integer not null,
  status text,
  user_id uuid references auth.users(id) on delete set null,
  context jsonb not null default '{}'::jsonb
);

create index if not exists system_metrics_recorded_at_idx on public.system_metrics (recorded_at desc);
create index if not exists system_metrics_kind_name_idx on public.system_metrics (kind, name, recorded_at desc);

grant select, insert on public.system_metrics to authenticated;
grant all on public.system_metrics to service_role;

alter table public.system_metrics enable row level security;

create policy "users insert own metrics"
  on public.system_metrics for insert to authenticated
  with check (auth.uid() = user_id or user_id is null);

create policy "admins read all metrics"
  on public.system_metrics for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'super_admin'));

create or replace function public.observability_summary(_window interval default interval '24 hours')
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'super_admin')) then
    raise exception 'forbidden';
  end if;

  select jsonb_build_object(
    'window_hours', extract(epoch from _window) / 3600,
    'errors_total', (select count(*) from public.system_errors where occurred_at >= now() - _window),
    'errors_by_source', (
      select coalesce(jsonb_object_agg(source, c), '{}'::jsonb)
      from (
        select source, count(*) as c
        from public.system_errors
        where occurred_at >= now() - _window
        group by source
      ) s
    ),
    'errors_by_level', (
      select coalesce(jsonb_object_agg(level, c), '{}'::jsonb)
      from (
        select level, count(*) as c
        from public.system_errors
        where occurred_at >= now() - _window
        group by level
      ) s
    ),
    'top_fingerprints', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      from (
        select fingerprint, count(*) as occurrences, max(occurred_at) as last_seen, max(message) as sample_message
        from public.system_errors
        where occurred_at >= now() - _window and fingerprint is not null
        group by fingerprint
        order by occurrences desc
        limit 10
      ) t
    ),
    'security_events_total', (select count(*) from public.security_events where created_at >= now() - _window),
    'notifications_failed', (select count(*) from public.notification_delivery_logs where created_at >= now() - _window and status = 'failed'),
    'notifications_delivered', (select count(*) from public.notification_delivery_logs where created_at >= now() - _window and status = 'sent'),
    'perf_p95_route_ms', (
      select percentile_cont(0.95) within group (order by duration_ms)
      from public.system_metrics
      where kind = 'route' and recorded_at >= now() - _window
    ),
    'perf_p95_server_fn_ms', (
      select percentile_cont(0.95) within group (order by duration_ms)
      from public.system_metrics
      where kind = 'server_fn' and recorded_at >= now() - _window
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.observability_summary(interval) from public;
grant execute on function public.observability_summary(interval) to authenticated;