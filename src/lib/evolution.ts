import "server-only";

// Cliente mínimo da Evolution API v2 (conexão do WhatsApp por QR Code).
// Tudo que fala com o WhatsApp passa por aqui, para facilitar trocar de provedor no futuro.

const EVENTOS = ["QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT", "SEND_MESSAGE"];

// Valor da variável sem espaços nem aspas coladas por engano.
const limpar = (valor: string | undefined) => (valor ?? "").trim().replace(/^["']+|["']+$/g, "").trim();

export class ErroEvolution extends Error {
  constructor(
    public status: number,
    public corpo: string,
  ) {
    super(`Evolution API ${status}: ${corpo}`);
  }
}

async function chamar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const base = limpar(process.env.EVOLUTION_API_URL).replace(/\/+$/, "");
  let resposta: Response;
  try {
    resposta = await fetch(`${base}${caminho}`, {
      ...init,
      headers: { "Content-Type": "application/json", apikey: limpar(process.env.EVOLUTION_API_KEY), ...init.headers },
      cache: "no-store",
    });
  } catch (e) {
    // Servidor fora do ar, endereço errado ou certificado inválido.
    throw new ErroEvolution(0, e instanceof Error ? `${e.message} ${String(e.cause ?? "")}` : String(e));
  }
  if (!resposta.ok) throw new ErroEvolution(resposta.status, await resposta.text());
  return resposta.json() as Promise<T>;
}

export function urlWebhook() {
  const app = (process.env.APP_URL ?? "").trim().replace(/\/+$/, "");
  return `${app}/api/whatsapp/webhook?token=${encodeURIComponent((process.env.WEBHOOK_SECRET ?? "").trim())}`;
}

export async function criarInstancia(instancia: string) {
  return chamar<{ qrcode?: { base64?: string } }>("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName: instancia,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
      groupsIgnore: true,
      syncFullHistory: true,
      webhook: { url: urlWebhook(), byEvents: false, base64: true, events: EVENTOS },
    }),
  });
}

// Reaplica avisos e preferências numa instância já existente (instâncias antigas foram criadas
// sem o aviso de mensagens enviadas e sem pedir o histórico completo).
export async function configurarInstancia(instancia: string) {
  await chamar(`/webhook/set/${instancia}`, {
    method: "POST",
    body: JSON.stringify({
      webhook: { enabled: true, url: urlWebhook(), byEvents: false, base64: true, events: EVENTOS },
    }),
  });
  await chamar(`/settings/set/${instancia}`, {
    method: "POST",
    body: JSON.stringify({
      rejectCall: false,
      groupsIgnore: true,
      alwaysOnline: false,
      readMessages: false,
      readStatus: false,
      syncFullHistory: true,
    }),
  });
}

type Chat = { remoteJid?: string; id?: string };

export async function listarConversas(instancia: string) {
  const r = await chamar<Chat[]>(`/chat/findChats/${instancia}`, { method: "POST", body: "{}" });
  return (Array.isArray(r) ? r : []).map((c) => c.remoteJid ?? c.id ?? "").filter(Boolean);
}

export async function listarMensagens(instancia: string, jid: string, limite: number) {
  const r = await chamar<{ messages?: { records?: unknown[] } } | unknown[]>(`/chat/findMessages/${instancia}`, {
    method: "POST",
    body: JSON.stringify({ where: { key: { remoteJid: jid } }, page: 1, offset: limite }),
  });
  const registros = Array.isArray(r) ? r : (r.messages?.records ?? []);
  return registros.slice(0, limite);
}

export async function gerarQrCode(instancia: string) {
  return chamar<{ base64?: string }>(`/instance/connect/${instancia}`);
}

export async function estadoConexao(instancia: string) {
  const r = await chamar<{ instance?: { state?: string } }>(`/instance/connectionState/${instancia}`);
  return r.instance?.state ?? "close";
}

export async function desconectar(instancia: string) {
  await chamar(`/instance/logout/${instancia}`, { method: "DELETE" }).catch(() => undefined);
}

export async function excluirInstancia(instancia: string) {
  await chamar(`/instance/delete/${instancia}`, { method: "DELETE" }).catch(() => undefined);
}

export async function enviarTexto(instancia: string, jid: string, texto: string) {
  return chamar<{ key?: { id?: string } }>(`/message/sendText/${instancia}`, {
    method: "POST",
    // Número comum vai só com os dígitos; contato identificado por código interno (@lid) vai completo.
    body: JSON.stringify({ number: jid.endsWith("@s.whatsapp.net") ? jid.split("@")[0] : jid, text: texto }),
  });
}
