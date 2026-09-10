-- =============================================================================
-- AMIGO SECRETO 3000 — Schema + RPC atómico + PIN por participante
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- =============================================================================

drop function if exists public.claim_assignment(text, text);
drop function if exists public.claim_assignment(text);
drop function if exists public.reset_game(text);
drop function if exists public._generate_derangement();
drop view if exists public.participants_public;
drop table if exists public.assignments;
drop table if exists public.participants;
drop table if exists public.games;

-- -----------------------------------------------------------------------------
create table public.games (
  id text primary key default 'default',
  name text not null default 'Amigo Secreto 3000',
  status text not null default 'ready'
    check (status in ('ready', 'active', 'closed')),
  acotado boolean not null default false,
  created_at timestamptz not null default now(),
  reset_at timestamptz
);

insert into public.games (id, name, status)
values ('default', 'Amigo Secreto 3000', 'ready')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- access_pin: clave privada por persona. NUNCA se expone al frontend vía SELECT.
-- -----------------------------------------------------------------------------
create table public.participants (
  id text primary key,
  name text not null,
  image_path text not null,
  access_pin text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint participants_pin_not_blank check (length(trim(access_pin)) >= 4)
);

-- Cambia estos PINs y dáselos en privado a cada persona.
-- Los id deben coincidir con src/data/participants.ts
insert into public.participants (id, name, image_path, access_pin, sort_order) values
  ('michael',   'Michael',    '/participants/michael.jpg', '4812', 1),
  ('kley',      'Kley',       '/participants/laura.svg',   '7390', 2),
  ('JuanLuis',  'Juan Luis',  '/participants/carlos.svg',  '1564', 3),
  ('JuanDavid', 'Juan David', '/participants/diana.svg',   '9023', 4),
  ('Maryuris',  'Maryuris',   '/participants/pedro.svg',   '4471', 5),
  ('Paula',     'Paula',      '/participants/sofia.svg',   '6288', 6),
  ('Yeiner',    'Yeiner',     '/participants/sofia.svg',   '3157', 7)
on conflict (id) do update set
  name = excluded.name,
  image_path = excluded.image_path,
  access_pin = excluded.access_pin,
  sort_order = excluded.sort_order,
  active = true;

-- -----------------------------------------------------------------------------
create table public.assignments (
  id bigint generated always as identity primary key,
  game_id text not null references public.games(id) on delete cascade,
  giver_id text not null references public.participants(id),
  receiver_id text not null references public.participants(id),
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint assignments_no_self check (giver_id <> receiver_id),
  constraint assignments_unique_giver unique (game_id, giver_id),
  constraint assignments_unique_receiver unique (game_id, receiver_id)
);

create index assignments_game_idx on public.assignments (game_id);
create index assignments_giver_idx on public.assignments (giver_id);

-- -----------------------------------------------------------------------------
alter table public.games enable row level security;
alter table public.participants enable row level security;
alter table public.assignments enable row level security;

-- Vista pública SIN access_pin (por si el frontend consulta participantes)
create view public.participants_public
with (security_invoker = true)
as
select id, name, image_path, sort_order, active
from public.participants
where active = true;

grant select on public.participants_public to anon, authenticated;

-- La tabla participants: sin SELECT para anon (evita filtrar PINs)
revoke all on table public.participants from anon, authenticated;

create policy "games_select"
  on public.games
  for select
  to anon, authenticated
  using (true);

-- assignments: sin políticas de lectura/escritura para anon

-- -----------------------------------------------------------------------------
create or replace function public._generate_derangement()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ids text[];
  n int;
  i int;
  j int;
  tmp text;
  receivers text[];
begin
  select array_agg(p.id order by p.sort_order, p.id)
  into ids
  from public.participants p
  where p.active = true;

  n := coalesce(array_length(ids, 1), 0);
  if n < 2 then
    raise exception 'Se necesitan al menos 2 participantes activos';
  end if;

  receivers := ids;

  for i in reverse n .. 2 loop
    j := 1 + floor(random() * (i - 1))::int;
    tmp := receivers[i];
    receivers[i] := receivers[j];
    receivers[j] := tmp;
  end loop;

  delete from public.assignments where game_id = 'default';

  for i in 1 .. n loop
    insert into public.assignments (game_id, giver_id, receiver_id)
    values ('default', ids[i], receivers[i]);
  end loop;

  update public.games
  set status = 'active', reset_at = now()
  where id = 'default';
end;
$$;

revoke all on function public._generate_derangement() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- claim_assignment: exige PIN + IDEMPOTENTE
-- Si ya existe asignación para ese giver → devuelve la MISMA (nunca reasigna).
-- Solo reset_game() genera un sorteo nuevo.
-- -----------------------------------------------------------------------------
create or replace function public.claim_assignment(
  p_participant_id text,
  p_access_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_giver public.participants%rowtype;
  v_receiver public.participants%rowtype;
  v_receiver_id text;
begin
  if p_participant_id is null or length(trim(p_participant_id)) = 0 then
    raise exception 'participant_id requerido';
  end if;

  if p_access_pin is null or length(trim(p_access_pin)) = 0 then
    raise exception 'PIN_REQUIRED';
  end if;

  perform 1 from public.games where id = 'default' for update;

  select * into v_giver
  from public.participants
  where id = p_participant_id and active = true;

  if not found then
    raise exception 'Participante no encontrado o inactivo';
  end if;

  -- Comparación constante-ish de PIN (trim, case-sensitive)
  if v_giver.access_pin is distinct from trim(p_access_pin) then
    raise exception 'PIN_INVALID';
  end if;

  select count(*) into v_count
  from public.assignments
  where game_id = 'default';

  if v_count = 0 then
    perform public._generate_derangement();
  end if;

  select a.receiver_id into v_receiver_id
  from public.assignments a
  where a.game_id = 'default' and a.giver_id = p_participant_id;

  if v_receiver_id is null then
    raise exception 'No hay asignación para este participante. ¿Se agregó después del sorteo? Ejecuta reset_game.';
  end if;

  -- Solo marca claimed_at la primera vez; NO cambia receiver_id
  update public.assignments
  set claimed_at = coalesce(claimed_at, now())
  where game_id = 'default' and giver_id = p_participant_id;

  select * into v_receiver
  from public.participants
  where id = v_receiver_id;

  return jsonb_build_object(
    'giver', jsonb_build_object(
      'id', v_giver.id,
      'name', v_giver.name,
      'image_path', v_giver.image_path
    ),
    'receiver', jsonb_build_object(
      'id', v_receiver.id,
      'name', v_receiver.name,
      'image_path', v_receiver.image_path
    ),
    'claimed_at', (select claimed_at from public.assignments
                   where game_id = 'default' and giver_id = p_participant_id)
  );
end;
$$;

grant execute on function public.claim_assignment(text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
create or replace function public.reset_game(p_admin_token text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected text := current_setting('app.reset_token', true);
begin
  if v_expected is not null and v_expected <> '' then
    if p_admin_token is distinct from v_expected then
      raise exception 'Token de reinicio inválido';
    end if;
  end if;

  perform public._generate_derangement();

  return jsonb_build_object(
    'ok', true,
    'message', 'Partida reiniciada. Nuevo derangement generado.',
    'reset_at', now()
  );
end;
$$;

revoke all on function public.reset_game(text) from public, anon, authenticated;
grant execute on function public.reset_game(text) to service_role;

-- Reiniciar: select public.reset_game();
-- Cambiar un PIN:
--   update public.participants set access_pin = '1234' where id = 'michael';
-- =============================================================================
