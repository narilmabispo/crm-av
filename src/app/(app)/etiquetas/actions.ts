"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CORES_ETIQUETA, ETIQUETAS_SUGERIDAS } from "@/lib/etiquetas";

export type EstadoEtiqueta = { erro?: string; ok?: number };

const corValida = (cor: string) => (cor in CORES_ETIQUETA ? cor : "roxo");

function atualizarTelas() {
  revalidatePath("/etiquetas");
  revalidatePath("/clientes", "layout");
}

export async function criarEtiqueta(_: EstadoEtiqueta, form: FormData): Promise<EstadoEtiqueta> {
  const nome = String(form.get("nome") ?? "").trim().slice(0, 40);
  if (!nome) return { erro: "Escreva o nome da etiqueta." };
  const supabase = await createClient();
  const { error } = await supabase.from("etiquetas").insert({ nome, cor: corValida(String(form.get("cor") ?? "")) });
  if (error?.code === "23505") return { erro: "Você já tem uma etiqueta com esse nome." };
  if (error) return { erro: "Não foi possível criar a etiqueta." };
  atualizarTelas();
  return { ok: Date.now() };
}

export async function atualizarEtiqueta(id: string, form: FormData) {
  const nome = String(form.get("nome") ?? "").trim().slice(0, 40);
  if (!nome) return;
  const supabase = await createClient();
  await supabase.from("etiquetas").update({ nome, cor: corValida(String(form.get("cor") ?? "")) }).eq("id", id);
  atualizarTelas();
}

export async function excluirEtiqueta(id: string) {
  const supabase = await createClient();
  await supabase.from("etiquetas").delete().eq("id", id);
  atualizarTelas();
}

export async function criarEtiquetasSugeridas() {
  const supabase = await createClient();
  await supabase.from("etiquetas").upsert(ETIQUETAS_SUGERIDAS, { onConflict: "assistente_id,nome", ignoreDuplicates: true });
  atualizarTelas();
}

// Coloca ou tira uma etiqueta de uma conversa (usado no chat).
export async function marcarEtiqueta(conversaId: string, etiquetaId: string, marcar: boolean): Promise<{ erro?: string }> {
  const supabase = await createClient();
  const { error } = marcar
    ? await supabase
        .from("conversa_etiquetas")
        .upsert({ conversa_id: conversaId, etiqueta_id: etiquetaId }, { ignoreDuplicates: true })
    : await supabase.from("conversa_etiquetas").delete().eq("conversa_id", conversaId).eq("etiqueta_id", etiquetaId);
  if (error) return { erro: "Não foi possível salvar a etiqueta." };
  revalidatePath("/etiquetas");
  return {};
}
