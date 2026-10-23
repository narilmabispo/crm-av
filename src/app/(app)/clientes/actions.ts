"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { excluirInstancia } from "@/lib/evolution";

export type EstadoCliente = { erro?: string; aviso?: string };

function lerCampos(form: FormData) {
  const texto = (k: string) => String(form.get(k) ?? "").trim() || null;
  return {
    nome: String(form.get("nome") ?? "").trim(),
    profissao: texto("profissao"),
    cidade: texto("cidade"),
    empresa: texto("empresa"),
    observacoes: texto("observacoes"),
  };
}

export async function criarCliente(_: EstadoCliente, form: FormData): Promise<EstadoCliente> {
  const campos = lerCampos(form);
  if (!campos.nome) return { erro: "Informe o nome do cliente." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("clientes")
    .insert({ ...campos, assistente_id: user.id })
    .select("id")
    .single();

  if (error?.message.includes("LIMITE_CLIENTES"))
    return { erro: "Você chegou ao limite de clientes do seu plano. Troque de plano para adicionar mais." };
  if (error?.message.includes("ASSINATURA_INATIVA"))
    return { erro: "Sua assinatura não está ativa. Regularize na página Minha conta." };
  if (error || !data) return { erro: "Não foi possível salvar o cliente." };

  revalidatePath("/painel");
  redirect(`/clientes/${data.id}`);
}

export async function atualizarCliente(id: string, _: EstadoCliente, form: FormData): Promise<EstadoCliente> {
  const campos = lerCampos(form);
  if (!campos.nome) return { erro: "Informe o nome do cliente." };

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").update(campos).eq("id", id);
  if (error) return { erro: "Não foi possível salvar as alterações." };

  revalidatePath(`/clientes/${id}`);
  revalidatePath("/painel");
  return { aviso: "Perfil salvo." };
}

export async function excluirCliente(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("conexoes_whatsapp").select("instancia").eq("cliente_id", id).maybeSingle();
  if (data) await excluirInstancia(data.instancia);
  await supabase.from("clientes").delete().eq("id", id);
  revalidatePath("/painel");
  redirect("/painel");
}
