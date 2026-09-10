import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey && !url.includes('TU_PROYECTO'))
}

/** Si VITE_ACOTADO=true → pares fijos (Kley→Michael, etc.). Si false → random. */
export function isAcotadoMode(): boolean {
  const raw = String(import.meta.env.VITE_ACOTADO ?? 'false').toLowerCase().trim()
  return raw === 'true' || raw === '1' || raw === 'yes'
}

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no configurado')
  }
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}
