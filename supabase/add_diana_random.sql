-- Añadir a Diana + pasar a sorteo 100% random y regenerar
-- Ejecutar en Supabase → SQL Editor

insert into public.participants (id, name, image_path, access_pin, sort_order, active)
values ('diana', 'Diana', '/participants/diana.svg', '8841', 8, true)
on conflict (id) do update set
  name = excluded.name,
  image_path = excluded.image_path,
  access_pin = excluded.access_pin,
  sort_order = excluded.sort_order,
  active = true;

-- Con Diana: todos los sorteos random (sin pares fijos)
update public.games set acotado = false where id = 'default';
select public._generate_derangement();

-- Verificación
select id, name, access_pin, active, sort_order
from public.participants
where active = true
order by sort_order, id;

select a.giver_id, a.receiver_id, a.claimed_at
from public.assignments a
where a.game_id = 'default'
order by a.giver_id;
