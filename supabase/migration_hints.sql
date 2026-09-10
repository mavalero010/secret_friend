-- =============================================================================
-- Pistas del amigo secreto
-- Ejecutar en Supabase → SQL Editor
-- =============================================================================

alter table public.assignments
  add column if not exists hint_text text;

alter table public.assignments
  add column if not exists hint_updated_at timestamptz;

-- El giver escribe una pista para su receiver (sin revelar identidad en get)
create or replace function public.set_my_hint(
  p_participant_id text,
  p_access_pin text,
  p_hint_text text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_giver public.participants%rowtype;
  v_hint text;
begin
  if p_participant_id is null or length(trim(p_participant_id)) = 0 then
    raise exception 'participant_id requerido';
  end if;
  if p_access_pin is null or length(trim(p_access_pin)) = 0 then
    raise exception 'PIN_REQUIRED';
  end if;

  v_hint := trim(coalesce(p_hint_text, ''));
  if length(v_hint) < 3 then
    raise exception 'HINT_TOO_SHORT';
  end if;
  if length(v_hint) > 500 then
    raise exception 'HINT_TOO_LONG';
  end if;

  select * into v_giver
  from public.participants
  where id = p_participant_id and active = true;

  if not found then
    raise exception 'Participante no encontrado o inactivo';
  end if;

  if v_giver.access_pin is distinct from trim(p_access_pin) then
    raise exception 'PIN_INVALID';
  end if;

  update public.assignments
  set hint_text = v_hint,
      hint_updated_at = now()
  where game_id = 'default'
    and giver_id = p_participant_id;

  if not found then
    raise exception 'No hay asignación. Reinicia el sorteo.';
  end if;

  return jsonb_build_object(
    'ok', true,
    'hint_text', v_hint,
    'hint_updated_at', now()
  );
end;
$fn$;

grant execute on function public.set_my_hint(text, text, text) to anon, authenticated;

-- El receiver lee la pista que le dejaron (NO incluye quién la escribió)
create or replace function public.get_hint_for_me(
  p_participant_id text,
  p_access_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_person public.participants%rowtype;
  v_hint text;
  v_updated timestamptz;
begin
  if p_participant_id is null or length(trim(p_participant_id)) = 0 then
    raise exception 'participant_id requerido';
  end if;
  if p_access_pin is null or length(trim(p_access_pin)) = 0 then
    raise exception 'PIN_REQUIRED';
  end if;

  select * into v_person
  from public.participants
  where id = p_participant_id and active = true;

  if not found then
    raise exception 'Participante no encontrado o inactivo';
  end if;

  if v_person.access_pin is distinct from trim(p_access_pin) then
    raise exception 'PIN_INVALID';
  end if;

  select a.hint_text, a.hint_updated_at
  into v_hint, v_updated
  from public.assignments a
  where a.game_id = 'default'
    and a.receiver_id = p_participant_id;

  if v_hint is null or length(trim(v_hint)) = 0 then
    return jsonb_build_object(
      'has_hint', false,
      'hint_text', null
    );
  end if;

  return jsonb_build_object(
    'has_hint', true,
    'hint_text', v_hint,
    'hint_updated_at', v_updated
  );
end;
$fn$;

grant execute on function public.get_hint_for_me(text, text) to anon, authenticated;

-- El giver recupera la pista que YA escribió (para editarla)
create or replace function public.get_my_outgoing_hint(
  p_participant_id text,
  p_access_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_person public.participants%rowtype;
  v_hint text;
begin
  if p_participant_id is null or length(trim(p_participant_id)) = 0 then
    raise exception 'participant_id requerido';
  end if;
  if p_access_pin is null or length(trim(p_access_pin)) = 0 then
    raise exception 'PIN_REQUIRED';
  end if;

  select * into v_person
  from public.participants
  where id = p_participant_id and active = true;

  if not found then
    raise exception 'Participante no encontrado o inactivo';
  end if;

  if v_person.access_pin is distinct from trim(p_access_pin) then
    raise exception 'PIN_INVALID';
  end if;

  select a.hint_text into v_hint
  from public.assignments a
  where a.game_id = 'default'
    and a.giver_id = p_participant_id;

  return jsonb_build_object(
    'hint_text', coalesce(v_hint, '')
  );
end;
$fn$;

grant execute on function public.get_my_outgoing_hint(text, text) to anon, authenticated;
