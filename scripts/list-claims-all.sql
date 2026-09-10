-- Todos los emparejamientos + si ya entraron + si dejaron pista
select
  g.name as quien_entra,
  r.name as le_toco,
  a.claimed_at as cuando,
  case when a.claimed_at is null then 'pendiente' else 'ya entro' end as estado,
  case
    when a.hint_text is not null and length(trim(a.hint_text)) > 0 then 'si'
    else 'no'
  end as pista
from public.assignments a
join public.participants g on g.id = a.giver_id
join public.participants r on r.id = a.receiver_id
where a.game_id = 'default'
order by (a.claimed_at is null), a.claimed_at nulls last, g.name;
