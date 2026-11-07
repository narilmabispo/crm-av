"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoPerfil = { erro?: string; aviso?: string };

export async function salvarPerfil(_: EstadoPerfil, form: FormData): Promise<EstadoPerfil> {
  const texto = (k: string) => String(form.get(k) ?? "").trim().slice(0, 120) || null;
  const nome = texto("nome");
  if (!nome) return { erro: "Informe seu nome." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("assistentes")
    .update({
      nome,
      telefone: texto("telefone"),
      cidade: texto("cidade"),
      documento: texto("documento"),
      instagram: texto("instagram")?.replace(/^@/, "") ?? null,
    })
    .eq("id", user.id);
  if (error) return { erro: "Não foi possível salvar. Confira se o arquivo 0004 já foi rodado no Supabase." };

  revalidatePath("/", "layout");
  return { aviso: "Dados salvos." };
}
