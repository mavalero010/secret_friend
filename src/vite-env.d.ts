/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** true = pares fijos; false = sorteo random */
  readonly VITE_ACOTADO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
