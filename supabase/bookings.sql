-- Booking system schema (safe to re-run)
create extension if not exists btree_gist;

create table if not exists public.services(
  id text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  name text not null check (char_length(name) between 1 and 80),
  duration_min int not null check (duration_min between 10 and 600),
  active boolean not null default true,
  sort int not null default 0
);
create table if not exists public.booking_settings(
  id int primary key default 1 check (id = 1),
  slot_minutes int not null default 30 check (slot_minutes between 10 and 240),
  -- keys "0".."6" = Sunday..Saturday, value = array of ["HH:MM","HH:MM"] ranges
  hours jsonb not null default '{"0":[["09:00","18:00"]],"1":[["09:00","18:00"]],"2":[["09:00","18:00"]],"3":[["09:00","18:00"]],"4":[["09:00","18:00"]],"5":[["09:00","13:00"]],"6":[]}',
  min_notice_hours int not null default 12 check (min_notice_hours between 0 and 720),
  max_days_ahead int not null default 60 check (max_days_ahead between 1 and 365)
);
insert into public.booking_settings(id) values (1) on conflict do nothing;
create table if not exists public.blocks(
  id uuid primary key default gen_random_uuid(),
  start_ts timestamptz not null, end_ts timestamptz not null check (end_ts > start_ts),
  reason text check (reason is null or char_length(reason) <= 120)
);
create table if not exists public.bookings(
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  service_id text not null references public.services(id),
  service_name text,
  start_ts timestamptz not null, end_ts timestamptz not null check (end_ts > start_ts),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  phone text not null check (phone ~ '^[0-9+\- ()]{9,20}$'),
  email text check (email is null or email = '' or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  notes text check (notes is null or char_length(notes) <= 1000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  decided_at timestamptz
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname='bookings_no_overlap') then
    alter table public.bookings add constraint bookings_no_overlap
      exclude using gist (tstzrange(start_ts,end_ts) with &&) where (status in ('pending','approved'));
  end if;
end $$;
create index if not exists bookings_start_idx on public.bookings(start_ts);

alter table public.services enable row level security;
alter table public.booking_settings enable row level security;
alter table public.blocks enable row level security;
alter table public.bookings enable row level security;
revoke all on public.services, public.booking_settings, public.blocks, public.bookings from anon, authenticated;
grant select, insert, update, delete on public.services, public.blocks, public.bookings to authenticated;
grant select, update on public.booking_settings to authenticated;
-- public may read active services only (no personal data there)
grant select on public.services to anon;
drop policy if exists "public services" on public.services;
create policy "public services" on public.services for select to anon, authenticated using (active or public.is_admin());
drop policy if exists "admin services" on public.services;
create policy "admin services" on public.services for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin settings" on public.booking_settings;
create policy "admin settings" on public.booking_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin blocks" on public.blocks;
create policy "admin blocks" on public.blocks for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin bookings" on public.bookings;
create policy "admin bookings" on public.bookings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Available slot starts for a service between two dates (Asia/Jerusalem). Returns times only.
create or replace function public.get_availability(p_service text, p_from date, p_to date)
returns table(slot_start timestamptz) language plpgsql stable security definer set search_path = '' as $$
declare s record; dur int; d date; rng jsonb; a time; b time; t timestamptz; tz text := 'Asia/Jerusalem';
begin
  select * into s from public.booking_settings where id = 1;
  select duration_min into dur from public.services where id = p_service and active;
  if dur is null then return; end if;
  p_from := greatest(p_from, (now() at time zone tz)::date);
  p_to := least(p_to, (now() at time zone tz)::date + s.max_days_ahead, p_from + 62);
  d := p_from;
  while d <= p_to loop
    for rng in select * from jsonb_array_elements(coalesce(s.hours -> extract(dow from d)::int::text, '[]'::jsonb)) loop
      a := (rng->>0)::time; b := (rng->>1)::time;
      t := (d + a) at time zone tz;
      while t + make_interval(mins => dur) <= (d + b) at time zone tz loop
        if t >= now() + make_interval(hours => s.min_notice_hours)
          and not exists (select 1 from public.bookings k where k.status in ('pending','approved')
                          and tstzrange(k.start_ts,k.end_ts) && tstzrange(t, t + make_interval(mins => dur)))
          and not exists (select 1 from public.blocks x where tstzrange(x.start_ts,x.end_ts) && tstzrange(t, t + make_interval(mins => dur)))
        then slot_start := t; return next; end if;
        t := t + make_interval(mins => s.slot_minutes);
      end loop;
    end loop;
    d := d + 1;
  end loop;
end $$;

-- Create a pending booking only if the slot is currently available (with simple rate limits).
create or replace function public.create_booking(p_service text, p_start timestamptz, p_name text, p_phone text, p_email text, p_notes text)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare dur int; sname text; new_id uuid; digits text := regexp_replace(coalesce(p_phone,''),'\D','','g');
begin
  select duration_min, name into dur, sname from public.services where id = p_service and active;
  if dur is null then raise exception 'invalid service'; end if;
  if (select count(*) from public.bookings where status='pending' and regexp_replace(phone,'\D','','g') = digits) >= 3
     or (select count(*) from public.bookings where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'rate limited' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.get_availability(p_service, (p_start at time zone 'Asia/Jerusalem')::date, (p_start at time zone 'Asia/Jerusalem')::date) g where g.slot_start = p_start) then
    raise exception 'slot unavailable' using errcode = 'P0001';
  end if;
  insert into public.bookings(service_id, service_name, start_ts, end_ts, name, phone, email, notes)
  values (p_service, sname, p_start, p_start + make_interval(mins => dur), btrim(p_name), btrim(p_phone), nullif(btrim(coalesce(p_email,'')),''), nullif(btrim(coalesce(p_notes,'')),''))
  returning id into new_id;
  return new_id;
exception when exclusion_violation then raise exception 'slot unavailable' using errcode = 'P0001';
end $$;

revoke all on function public.get_availability(text,date,date) from public;
revoke all on function public.create_booking(text,timestamptz,text,text,text,text) from public;
grant execute on function public.get_availability(text,date,date) to anon, authenticated;
grant execute on function public.create_booking(text,timestamptz,text,text,text,text) to anon, authenticated;
