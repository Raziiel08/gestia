import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL

const clavePublica =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const configuracionFaltante =
  !url || !clavePublica
    ? 'Falta configurar Supabase. Creá un archivo .env en la raíz del proyecto con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (o VITE_SUPABASE_PUBLISHABLE_KEY).'
    : null

export const supabase = configuracionFaltante
  ? null
  : createClient(url, clavePublica)
