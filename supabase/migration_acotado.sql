-- =============================================================================
-- Modo ACOTADO: pares fijos + resto aleatorio
-- Ejecutar en SQL Editor (actualiza funciones existentes)
-- =============================================================================

alter table public.games
  add column if not exists acotado boolean not null default false;

-- -----------------------------------------------------------------------------
-- Genera sorteo:
--   acotado = false → derangement total (Sattolo)
--   acotado = true  → fuerza:
--     kley     → michael
--     JuanLuis → Maryuris
--     michael  → Paula
--     y el resto se empareja al azar sin autoasignarse
-- -----------------------------------------------------------------------------
create or replace function public._generate_derangement()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_acotado boolean;
  ids text[];
  n int;
  i int;
  j int;
  tmp text;
  receivers text[];
  fixed_givers text[] := array['kley', 'JuanLuis', 'michael'];
  fixed_receivers text[] := array['michael', 'Maryuris', 'Paula'];
  free_givers text[];
  free_receivers text[];
  m int;
  attempt int;
  ok boolean;
begin
  select coalesce(g.acotado, false) into v_acotado
  from public.games g
  where g.id = 'default';

  select array_agg(p.id order by p.sort_order, p.id)
  into ids
  from public.participants p
  where p.active = true;

  n := coalesce(array_length(ids, 1), 0);
  if n < 2 then
    raise exception 'Se necesitan al menos 2 participantes activos';
  end if;

  delete from public.assignments where game_id = 'default';

  if not v_acotado then
    -- ===== MODO RANDOM: Sattolo =====
    receivers := ids;
    for i in reverse n .. 2 loop
      j := 1 + floor(random() * (i - 1))::int;
      tmp := receivers[i];
      receivers[i] := receivers[j];
      receivers[j] := tmp;
    end loop;

    for i in 1 .. n loop
      insert into public.assignments (game_id, giver_id, receiver_id)
      values ('default', ids[i], receivers[i]);
    end loop;
  else
    -- ===== MODO ACOTADO =====
    -- Validar que existan los ids fijos
    for i in 1 .. array_length(fixed_givers, 1) loop
      if not (fixed_givers[i] = any (ids)) then
        raise exception 'Modo acotado: falta participante activo %', fixed_givers[i];
      end if;
      if not (fixed_receivers[i] = any (ids)) then
        raise exception 'Modo acotado: falta destinatario activo %', fixed_receivers[i];
      end if;
    end loop;

    -- Insertar pares fijos
    for i in 1 .. array_length(fixed_givers, 1) loop
      insert into public.assignments (game_id, giver_id, receiver_id)
      values ('default', fixed_givers[i], fixed_receivers[i]);
    end loop;

    -- Givers libres = activos que no están en fixed_givers
    select array_agg(x order by x)
    into free_givers
    from unnest(ids) as x
    where not (x = any (fixed_givers));

    -- Receivers libres = activos que no estén ya tomados como receiver fijo
    select array_agg(x order by x)
    into free_receivers
    from unnest(ids) as x
    where not (x = any (fixed_receivers));

    m := coalesce(array_length(free_givers, 1), 0);
    if m <> coalesce(array_length(free_receivers, 1), 0) then
      raise exception 'Modo acotado: conjuntos libre giver/receiver incompatibles';
    end if;

    if m > 0 then
      ok := false;
      for attempt in 1 .. 200 loop
        -- barajar free_receivers (Fisher-Yates)
        receivers := free_receivers;
        for i in reverse m .. 2 loop
          j := 1 + floor(random() * i)::int;
          tmp := receivers[i];
          receivers[i] := receivers[j];
          receivers[j] := tmp;
        end loop;

        ok := true;
        for i in 1 .. m loop
          if free_givers[i] = receivers[i] then
            ok := false;
            exit;
          end if;
        end loop;

        exit when ok;
      end loop;

      if not ok then
        raise exception 'Modo acotado: no se pudo completar el sorteo del resto sin autoasignaciones';
      end if;

      for i in 1 .. m loop
        insert into public.assignments (game_id, giver_id, receiver_id)
        values ('default', free_givers[i], receivers[i]);
      end loop;
    end if;
  end if;

  update public.games
  set status = 'active', reset_at = now()
  where id = 'default';
end;
$$;

revoke all on function public._generate_derangement() from public, anon, authenticated;

-- claim ahora recibe el flag desde el frontend (VITE_ACOTADO)
drop function if exists public.claim_assignment(text, text);
drop function if exists public.claim_assignment(text, text, boolean);

create or replace function public.claim_assignment(
  p_participant_id text,
  p_access_pin text,
  p_acotado boolean default null
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

  if v_giver.access_pin is distinct from trim(p_access_pin) then
    raise exception 'PIN_INVALID';
  end if;

  select count(*) into v_count
  from public.assignments
  where game_id = 'default';

  -- Solo al crear el sorteo (primera vez) se aplica el modo acotado del .env
  if v_count = 0 then
    if p_acotado is not null then
      update public.games set acotado = p_acotado where id = 'default';
    end if;
    perform public._generate_derangement();
  end if;

  select a.receiver_id into v_receiver_id
  from public.assignments a
  where a.game_id = 'default' and a.giver_id = p_participant_id;

  if v_receiver_id is null then
    raise exception 'No hay asignación para este participante. Ejecuta reset_game.';
  end if;

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
                   where game_id = 'default' and giver_id = p_participant_id),
    'acotado', (select acotado from public.games where id = 'default')
  );
end;
$$;

grant execute on function public.claim_assignment(text, text, boolean) to anon, authenticated;

-- reset_game también puede recibir el flag
drop function if exists public.reset_game(text);
drop function if exists public.reset_game(text, boolean);

create or replace function public.reset_game(
  p_admin_token text default null,
  p_acotado boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected text := current_setting('app.reset_token', true);
  v_acotado boolean;
begin
  if v_expected is not null and v_expected <> '' then
    if p_admin_token is distinct from v_expected then
      raise exception 'Token de reinicio inválido';
    end if;
  end if;

  if p_acotado is not null then
    update public.games set acotado = p_acotado where id = 'default';
  end if;

  perform public._generate_derangement();

  select acotado into v_acotado from public.games where id = 'default';

  return jsonb_build_object(
    'ok', true,
    'acotado', v_acotado,
    'message', 'Partida reiniciada.',
    'reset_at', now()
  );
end;
$$;

revoke all on function public.reset_game(text, boolean) from public, anon, authenticated;
grant execute on function public.reset_game(text, boolean) to service_role;

-- Ejemplos:
--   Modo acotado ON + nuevo sorteo:
--     select public.reset_game(null, true);
--   Modo random:
--     select public.reset_game(null, false);
-- =============================================================================
