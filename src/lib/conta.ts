import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Cliente = {
  id: string;
  nome: string;
  profissao: string | null;
  cidade: string | null;
  empresa: string | null;
  observacoes: string | null;
};

// Dados da assistente logada, da assinatura e do plano, usados em todas as telas internas.
export async function carregarConta() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: assistente }, { data: assinatura }, { count }] = await Promise.all([
    supabase.from("assistentes").select("nome").eq("id", user.id).single(),
    supabase
      .from("assinaturas")
      .select("status, plano:planos(id, nome, limite_clientes)")
      .eq("assistente_id", user.id)
      .single(),
    supabase.from("clientes").select("id", { count: "exact", head: true }),
  ]);

  const plano = assinatura?.plano as unknown as { id: string; nome: string; limite_clientes: number } | null;
  const totalClientes = count ?? 0;
  const limite = plano?.limite_clientes ?? 0;

  return {
    supabase,
    user,
    nome: assistente?.nome || user.email || "",
    status: assinatura?.status ?? "cancelada",
    plano,
    totalClientes,
    limite,
    podeAdicionar: totalClientes < limite && ["teste", "ativa"].includes(assinatura?.status ?? ""),
  };
}
