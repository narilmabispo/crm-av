"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type EstadoForm = { erro?: string; aviso?: string };

export async function entrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email")),
    password: String(form.get("senha")),
  });
  if (error) return { erro: "E-mail ou senha incorretos." };
  redirect("/painel");
}

export async function cadastrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const senha = String(form.get("senha"));
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };

  const origem = (await headers()).get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(form.get("email")),
    password: senha,
    options: {
      data: { nome: String(form.get("nome")) },
      emailRedirectTo: `${origem}/auth/confirmar`,
    },
  });
  if (error) return { erro: "Não foi possível criar a conta. Verifique o e-mail e tente novamente." };
  if (!data.session) return { aviso: "Enviamos um link de confirmação para o seu e-mail." };
  redirect("/painel");
}

export async function recuperarSenha(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const origem = (await headers()).get("origin");
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(String(form.get("email")), {
    redirectTo: `${origem}/auth/confirmar?proximo=/conta`,
  });
  return { aviso: "Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha." };
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
