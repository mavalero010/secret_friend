import { createClient } from '@supabase/supabase-js'

const showAll = process.argv.includes('--all')

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(`
Falta configuración en .env.local:

  VITE_SUPABASE_URL=https://xxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJ...   (Settings → API → service_role)

NO uses la anon key aquí: no puede leer assignments.
NO pongas prefijo VITE_ a la service role (no debe ir al frontend).

Luego:
  npm run claims
  npm run claims:all
`)
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: assignments, error: aErr } = await supabase
  .from('assignments')
  .select('giver_id, receiver_id, claimed_at, hint_text')
  .eq('game_id', 'default')
  .order('claimed_at', { ascending: true, nullsFirst: false })

if (aErr) {
  console.error('Error al leer assignments:', aErr.message)
  process.exit(1)
}

const { data: participants, error: pErr } = await supabase
  .from('participants')
  .select('id, name')

if (pErr) {
  console.error('Error al leer participants:', pErr.message)
  process.exit(1)
}

const nameById = new Map((participants ?? []).map((p) => [p.id, p.name]))

let rows = (assignments ?? []).map((a) => {
  const hasHint = Boolean(a.hint_text && String(a.hint_text).trim())
  return {
    quien_entra: nameById.get(a.giver_id) ?? a.giver_id,
    le_toco: nameById.get(a.receiver_id) ?? a.receiver_id,
    cuando: a.claimed_at,
    estado: a.claimed_at ? 'ya entro' : 'pendiente',
    pista: hasHint ? 'si' : 'no',
  }
})

if (!showAll) {
  rows = rows.filter((r) => r.estado === 'ya entro')
}

if (rows.length === 0) {
  console.log(
    showAll
      ? 'No hay asignaciones todavía. ¿Corriste el sorteo (reset)?'
      : 'Nadie ha reclamado aún su amigo secreto.',
  )
  process.exit(0)
}

console.log(
  showAll
    ? `\nEmparejamientos (${rows.length})\n`
    : `\nYa reclamaron su amigo secreto (${rows.length})\n`,
)

console.table(
  showAll
    ? rows
    : rows.map(({ quien_entra, le_toco, cuando, pista }) => ({
        quien_entra,
        le_toco,
        cuando,
        pista,
      })),
)
