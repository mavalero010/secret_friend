-- PASO 2/2 — Activar modo acotado y generar sorteo
-- Ejecutar DESPUÉS del paso 1, cuando ese haya salido OK.

update public.games set acotado = true where id = 'default';

select public._generate_derangement();

select a.giver_id, a.receiver_id
from public.assignments a
where a.game_id = 'default'
order by a.giver_id;
