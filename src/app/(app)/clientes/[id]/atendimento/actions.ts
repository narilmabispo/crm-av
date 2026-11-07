"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as evolution from "@/lib/evolution";
import { ehConversaIndividual, resumo } from "@/lib/mensagem-whatsapp";
import { garantirArquivo, linkTemporario } from "@/lib/midia";
import { salvarMensagens, type MensagemEvolution } from "@/lib/salvar-mensagens";

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
  if (!(e instanceof evolution.ErroEvolution)) return "Erro inesperado no servidor do WhatsApp.";
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
  await evolution.configurarInstancia(instancia).catch((e) => console.error("configurarInstancia", e));

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

type Envio = { tipo: string; texto: string; midia_path?: string; midia_mimetype?: string; midia_nome?: string };

// Confere a conversa e a conexão, envia pelo WhatsApp e registra a mensagem no chat.
async function enviar(
  conversaId: string,
  envio: Envio,
  mandar: (instancia: string, jid: string) => Promise<{ key?: { id?: string } }>,
): Promise<{ erro?: string }> {
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
    waId = (await mandar(conexao.instancia, conversa.jid)).key?.id;
  } catch (e) {
    console.error("enviar", e);
    return { erro: `Não foi possível enviar. ${explicarErro(e)}` };
  }

  const agora = new Date().toISOString();
  await admin.from("mensagens").upsert(
    {
      conversa_id: conversa.id,
      assistente_id: conversa.assistente_id,
      wa_id: waId ?? `local-${crypto.randomUUID()}`,
      de_mim: true,
      enviada_em: agora,
      ...envio,
    },
    // Sem ignorar duplicadas: se o aviso do WhatsApp chegou antes, completamos com o arquivo.
    { onConflict: "conversa_id,wa_id" },
  );
  await admin
    .from("conversas")
    .update({ ultima_mensagem: resumo(envio.tipo, envio.texto), ultima_em: agora, nao_lidas: 0 })
    .eq("id", conversa.id);
  return {};
}

export async function enviarMensagem(conversaId: string, texto: string): Promise<{ erro?: string }> {
  const limpo = texto.trim();
  if (!limpo) return {};
  return enviar(conversaId, { tipo: "texto", texto: limpo }, (instancia, jid) =>
    evolution.enviarTexto(instancia, jid, limpo),
  );
}

type Arquivo = { caminho: string; mimetype: string; nome: string; legenda?: string };

// O navegador já subiu o arquivo para a pasta da assistente no Supabase; aqui ele vai para o WhatsApp.
export async function enviarArquivo(conversaId: string, arquivo: Arquivo): Promise<{ erro?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !arquivo.caminho.startsWith(`${user.id}/`)) return { erro: "Arquivo inválido." };

  const admin = createAdminClient();
  const url = await linkTemporario(admin, arquivo.caminho, 600);
  if (!url) return { erro: "Não encontrei o arquivo enviado. Tente de novo." };

  const mime = arquivo.mimetype || "application/octet-stream";
  const legenda = arquivo.legenda?.trim() ?? "";
  const base = { texto: legenda, midia_path: arquivo.caminho, midia_mimetype: mime, midia_nome: arquivo.nome };

  if (mime.startsWith("audio/")) {
    return enviar(conversaId, { ...base, tipo: "áudio", texto: "" }, (instancia, jid) =>
      evolution.enviarAudio(instancia, jid, url),
    );
  }
  const tipo = mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : "document";
  const rotulo = { image: "imagem", video: "vídeo", document: "documento" }[tipo];
  return enviar(conversaId, { ...base, tipo: rotulo }, (instancia, jid) =>
    evolution.enviarMidia(instancia, jid, { tipo, url, mimetype: mime, nome: arquivo.nome, legenda }),
  );
}

// Figurinhas que a assistente já recebeu, para reaproveitar no envio.
export async function listarFigurinhas(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mensagens")
    .select("id")
    .eq("tipo", "figurinha")
    .order("enviada_em", { ascending: false })
    .limit(40);
  return (data ?? []).map((m) => m.id);
}

export async function enviarFigurinha(conversaId: string, mensagemOrigemId: string): Promise<{ erro?: string }> {
  const supabase = await createClient();
  const { data: origem } = await supabase
    .from("mensagens")
    .select("id, wa_id, assistente_id, midia_path, midia_mimetype, conversa:conversas(cliente_id)")
    .eq("id", mensagemOrigemId)
    .single();
  if (!origem) return { erro: "Figurinha não encontrada." };

  const admin = createAdminClient();
  const caminho = await garantirArquivo(admin, {
    ...origem,
    cliente_id: (origem.conversa as unknown as { cliente_id: string }).cliente_id,
  });
  const url = caminho ? await linkTemporario(admin, caminho, 600) : null;
  if (!caminho || !url) return { erro: "Essa figurinha não está mais disponível." };

  return enviar(
    conversaId,
    { tipo: "figurinha", texto: "", midia_path: caminho, midia_mimetype: origem.midia_mimetype ?? "image/webp" },
    (instancia, jid) => evolution.enviarFigurinha(instancia, jid, url),
  );
}

export async function marcarComoLida(conversaId: string) {
  const supabase = await createClient();
  await supabase.from("conversas").update({ nao_lidas: 0 }).eq("id", conversaId);
}

const LIMITE_CONVERSAS = 40;
const LIMITE_MENSAGENS = 50;

// Traz para a plataforma as conversas que o servidor do WhatsApp já guardou
// (o histórico que o WhatsApp entrega quando o aparelho é conectado).
export async function importarHistorico(clienteId: string): Promise<{ conversas?: number; erro?: string }> {
  const cliente = await clienteDaAssistente(clienteId);
  const admin = createAdminClient();
  const instancia = `av-${cliente.id}`;
  const conexao = { cliente_id: cliente.id, assistente_id: cliente.assistente_id };

  try {
    await evolution.configurarInstancia(instancia).catch((e) => console.error("configurarInstancia", e));
    const [chats, nomes] = await Promise.all([evolution.listarConversas(instancia), evolution.listarNomes(instancia)]);
    for (const c of chats) if (c.nome && !nomes.has(c.jid)) nomes.set(c.jid, c.nome);
    const jids = chats.map((c) => c.jid).filter(ehConversaIndividual).slice(0, LIMITE_CONVERSAS);

    let importadas = 0;
    for (let i = 0; i < jids.length; i += 5) {
      const lote = jids.slice(i, i + 5);
      await Promise.all(
        lote.map(async (jid) => {
          const mensagens = (await evolution.listarMensagens(instancia, jid, LIMITE_MENSAGENS)) as MensagemEvolution[];
          if (!mensagens.length) return;
          await salvarMensagens(admin, conexao, mensagens, { historico: true, nomes });
          importadas++;
        }),
      );
    }
    revalidatePath(`/clientes/${clienteId}`);
    return { conversas: importadas };
  } catch (e) {
    console.error("importarHistorico", e);
    return { erro: explicarErro(e) };
  }
}
