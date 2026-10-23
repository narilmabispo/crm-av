import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente com a chave de serviço: ignora as regras de acesso. Usar só no servidor,
// em rotas que validam por conta própria quem está chamando (ex.: webhook).
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}
