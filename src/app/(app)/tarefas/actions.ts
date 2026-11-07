"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EstadoTarefa = { erro?: string; ok?: number };

function atualizarTelas() {
  revalidatePath("/tarefas");
  revalidatePath("/painel");
}

export async function criarTarefa(_: EstadoTarefa, form: FormData): Promise<EstadoTarefa> {
  const titulo = String(form.get("titulo") ?? "").trim().slice(0, 200);
  if (!titulo) return { erro: "Escreva o que precisa ser feito." };
  const texto = (k: string) => String(form.get(k) ?? "").trim() || null;
  const vence = texto("vence_em");

  const supabase = await createClient();
  const { error } = await supabase.from("tarefas").insert({
    titulo,
    cliente_id: texto("cliente_id"),
    conversa_id: texto("conversa_id"),
    vence_em: vence && /^\d{4}-\d{2}-\d{2}$/.test(vence) ? vence : null,
  });
  if (error) return { erro: "Não foi possível salvar a tarefa." };
  atualizarTelas();
  return { ok: Date.now() };
}

export async function marcarTarefa(id: string, feita: boolean) {
  const supabase = await createClient();
  await supabase
    .from("tarefas")
    .update({ feita, feita_em: feita ? new Date().toISOString() : null })
    .eq("id", id);
  atualizarTelas();
}

export async function excluirTarefa(id: string) {
  const supabase = await createClient();
  await supabase.from("tarefas").delete().eq("id", id);
  atualizarTelas();
}
