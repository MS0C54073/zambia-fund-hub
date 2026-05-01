create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  surface text,
  label text,
  user_id uuid,
  session_id text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);
create index if not exists analytics_events_event_name_idx
  on public.analytics_events (event_name, created_at desc);
create index if not exists analytics_events_surface_label_idx
  on public.analytics_events (surface, label);

alter table public.analytics_events enable row level security;

drop policy if exists "anyone can insert analytics events" on public.analytics_events;
create policy "anyone can insert analytics events"
  on public.analytics_events for insert
  to anon, authenticated
  with check (true);

drop policy if exists "admins can read analytics events" on public.analytics_events;
create policy "admins can read analytics events"
  on public.analytics_events for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create or replace function public.track_event(
  _event_name text,
  _surface text default null,
  _label text default null,
  _session_id text default null,
  _properties jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if _event_name is null or length(_event_name) = 0 then
    return;
  end if;
  insert into public.analytics_events
    (event_name, surface, label, user_id, session_id, properties)
  values (
    left(_event_name, 80),
    nullif(left(coalesce(_surface, ''), 80), ''),
    nullif(left(coalesce(_label, ''), 120), ''),
    auth.uid(),
    nullif(left(coalesce(_session_id, ''), 64), ''),
    coalesce(_properties, '{}'::jsonb)
  );
end;
$$;

grant execute on function public.track_event(text, text, text, text, jsonb)
  to anon, authenticated;