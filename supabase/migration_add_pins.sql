-- =============================================================================
-- Migración: agregar PINs (si YA corriste el schema anterior)
-- Ejecutar UNA vez en SQL Editor.
-- =============================================================================

-- 1) Columna de PIN
alter table public.participants
  add column if not exists access_pin text;

-- 2) Asigna un PIN a cada participante actual (cámbialos)
update public.participants set access_pin = '4812' where id = 'michael'   and (access_pin is null or access_pin = '');
update public.participants set access_pin = '7390' where id = 'kley'      and (access_pin is null or access_pin = '');
update public.participants set access_pin = '1564' where id = 'JuanLuis'  and (access_pin is null or access_pin = '');
update public.participants set access_pin = '9023' where id = 'JuanDavid' and (access_pin is null or access_pin = '');
update public.participants set access_pin = '4471' where id = 'Maryuris'  and (access_pin is null or access_pin = '');
update public.participants set access_pin = '6288' where id = 'Paula'     and (access_pin is null or access_pin = '');
update public.participants set access_pin = '3157' where id = 'Yeiner'    and (access_pin is null or access_pin = '');

-- Fallback para cualquier otro sin PIN
update public.participants
set access_pin = lpad((1000 + (random() * 8999)::int)::text, 4, '0')
where access_pin is null or trim(access_pin) = '';

alter table public.participants
  alter column access_pin set not null;

-- 3) Quitar lectura directa de la tabla (para no filtrar PINs)
drop policy if exists "participants_select_active" on public.participants;
revoke all on table public.participants from anon, authenticated;

drop view if exists public.participants_public;
create view public.participants_public
with (security_invoker = true)
as
select id, name, image_path, sort_order, active
from public.participants
where active = true;

grant select on public.participants_public to anon, authenticated;

-- 4) Reemplazar RPC: ahora exige PIN y sigue siendo idempotente
drop function if exists public.claim_assignment(text);
drop function if exists public.claim_assignment(text, text);

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
                   where game_id = 'default' and giver_id = p_participant_id)
  );
end;
$$;

grant execute on function public.claim_assignment(text, text) to anon, authenticated;
