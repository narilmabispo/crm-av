"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as evolution from "@/lib/evolution";

export type Conexao = { status: string; qr_code: string | null; numero: string | null };

// Confere que o cliente pertence à assistente logada (as regras do banco filtram a consulta).
async function clienteDaAssistente(clienteId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("clientes").select("id, assistente_id").eq("id", clienteId).single();
  if (!data) throw new Error("Cliente não encontrado");
  return data;
}

const VARIAVEIS = ["EVOLUTION_API_URL", "EVOLUTION_API_KEY", "SUPABASE_SERVICE_ROLE_KEY", "APP_URL", "WEBHOOK_SECRET"];

// Traduz a falha da Evolution API numa mensagem que diz o que conferir na configuração.
function explicarErro(e: unknown): string {
  if (!(e instanceof evolution.ErroEvolution)) return "Erro inesperado ao gerar o QR Code.";
  if (e.status === 0) return `Não consegui acessar o servidor do WhatsApp. Confira o EVOLUTION_API_URL na Vercel. (${e.corpo.slice(0, 120)})`;
  if (e.status === 401 || (e.status === 403 && /unauthorized|forbidden/i.test(e.corpo)))
    return "O servidor do WhatsApp recusou a chave. Confira o EVOLUTION_API_KEY na Vercel.";
  if (e.status === 404) return "Endereço do servidor do WhatsApp incompleto. Confira o EVOLUTION_API_URL na Vercel.";
  return `O servidor do WhatsApp respondeu com erro ${e.status}: ${e.corpo.slice(0, 160)}`;
}

export async function conectarWhatsapp(clienteId: string): Promise<{ conexao?: Conexao; erro?: string }> {
  const faltando = VARIAVEIS.filter((v) => !process.env[v]?.trim());
  if (faltando.length) return { erro: `Falta configurar na Vercel: ${faltando.join(", ")}.` };

  const cliente = await clienteDaAssistente(clienteId);
  const admin = createAdminClient();
  const instancia = `av-${cliente.id}`;

  const { data: existente, error: erroBanco } = await admin
    .from("conexoes_whatsapp")
    .select("id")
    .eq("cliente_id", cliente.id)
    .maybeSingle();
  if (erroBanco) return { erro: "Não consegui acessar o banco de dados. Confira o SUPABASE_SERVICE_ROLE_KEY na Vercel." };

  let qr: string | null = null;
  try {
    if (existente) {
      qr = (await evolution.gerarQrCode(instancia)).base64 ?? null;
    } else {
      try {
        qr = (await evolution.criarInstancia(instancia)).qrcode?.base64 ?? null;
      } catch (e) {
        // A instância já existe no servidor (por exemplo, de uma tentativa anterior): só pede um QR Code novo.
        if (!(e instanceof evolution.ErroEvolution && /already in use/i.test(e.corpo))) throw e;
        qr = (await evolution.gerarQrCode(instancia)).base64 ?? null;
      }
    }
  } catch (e) {
    console.error("conectarWhatsapp", e);
    return { erro: explicarErro(e) };
  }

  const conexao = { status: "aguardando_qr", qr_code: qr, numero: null };
  const { error: erroSalvar } = await admin.from("conexoes_whatsapp").upsert(
    {
      cliente_id: cliente.id,
      assistente_id: cliente.assistente_id,
      instancia,
      ...conexao,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "cliente_id" },
  );
  if (erroSalvar) return { erro: "Não consegui salvar a conexão no banco. Confira o SUPABASE_SERVICE_ROLE_KEY na Vercel." };
  return { conexao };
}

// Chamado enquanto o QR Code está na tela: confirma o estado direto na Evolution API,
// caso o aviso pelo webhook demore ou se perca.
export async function verificarConexao(clienteId: string): Promise<Conexao> {
  const cliente = await clienteDaAssistente(clienteId);
  const admin = createAdminClient();
  const { data } = await admin
    .from("conexoes_whatsapp")
    .select("instancia, status, qr_code, numero")
    .eq("cliente_id", cliente.id)
    .maybeSingle();
  if (!data) return { status: "desconectado", qr_code: null, numero: null };

  const estado = await evolution.estadoConexao(data.instancia).catch(() => null);
  if (estado === "open" && data.status !== "conectado") {
    await admin
      .from("conexoes_whatsapp")
      .update({ status: "conectado", qr_code: null, atualizado_em: new Date().toISOString() })
      .eq("cliente_id", cliente.id);
    revalidatePath(`/clientes/${clienteId}`);
    return { status: "conectado", qr_code: null, numero: data.numero };
  }
  return { status: data.status, qr_code: data.qr_code, numero: data.numero };
}

export async function desconectarWhatsapp(clienteId: string) {
  const cliente = await clienteDaAssistente(clienteId);
  const admin = createAdminClient();
  await evolution.desconectar(`av-${cliente.id}`);
  await admin
    .from("conexoes_whatsapp")
    .update({ status: "desconectado", qr_code: null, atualizado_em: new Date().toISOString() })
    .eq("cliente_id", cliente.id);
  revalidatePath(`/clientes/${clienteId}`);
}

export async function enviarMensagem(conversaId: string, texto: string): Promise<{ erro?: string }> {
  const limpo = texto.trim();
  if (!limpo) return {};

  const supabase = await createClient();
  const { data: conversa } = await supabase
    .from("conversas")
    .select("id, jid, cliente_id, assistente_id")
    .eq("id", conversaId)
    .single();
  if (!conversa) return { erro: "Conversa não encontrada." };

  const admin = createAdminClient();
  const { data: conexao } = await admin
    .from("conexoes_whatsapp")
    .select("instancia, status")
    .eq("cliente_id", conversa.cliente_id)
    .single();
  if (conexao?.status !== "conectado") return { erro: "O WhatsApp deste cliente está desconectado." };

  let waId: string | undefined;
  try {
    waId = (await evolution.enviarTexto(conexao.instancia, conversa.jid, limpo)).key?.id;
  } catch {
    return { erro: "Não foi possível enviar. Tente de novo em instantes." };
  }

  const agora = new Date().toISOString();
  await admin.from("mensagens").upsert(
    {
      conversa_id: conversa.id,
      assistente_id: conversa.assistente_id,
      wa_id: waId ?? `local-${crypto.randomUUID()}`,
      de_mim: true,
      tipo: "texto",
      texto: limpo,
      enviada_em: agora,
    },
    { onConflict: "conversa_id,wa_id", ignoreDuplicates: true },
  );
  await admin
    .from("conversas")
    .update({ ultima_mensagem: limpo, ultima_em: agora, nao_lidas: 0 })
    .eq("id", conversa.id);
  return {};
}

export async function marcarComoLida(conversaId: string) {
  const supabase = await createClient();
  await supabase.from("conversas").update({ nao_lidas: 0 }).eq("id", conversaId);
}
