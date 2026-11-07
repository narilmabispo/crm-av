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
      webhook: { url: urlWebhook(), byEvents: false, base64: false, events: EVENTOS },
    }),
  });
}

// Reaplica avisos e preferências numa instância já existente (instâncias antigas foram criadas
// sem o aviso de mensagens enviadas e sem pedir o histórico completo).
export async function configurarInstancia(instancia: string) {
  await chamar(`/webhook/set/${instancia}`, {
    method: "POST",
    body: JSON.stringify({
      webhook: { enabled: true, url: urlWebhook(), byEvents: false, base64: false, events: EVENTOS },
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

type Chat = { remoteJid?: string; id?: string; pushName?: string | null; name?: string | null };

export async function listarConversas(instancia: string) {
  const r = await chamar<Chat[]>(`/chat/findChats/${instancia}`, { method: "POST", body: "{}" });
  return (Array.isArray(r) ? r : [])
    .map((c) => ({ jid: c.remoteJid ?? c.id ?? "", nome: c.pushName || c.name || null }))
    .filter((c) => c.jid);
}

// Nomes dos contatos salvos no servidor, por código do WhatsApp.
export async function listarNomes(instancia: string) {
  const nomes = new Map<string, string>();
  const r = await chamar<Chat[]>(`/chat/findContacts/${instancia}`, { method: "POST", body: "{}" }).catch(() => []);
  for (const c of Array.isArray(r) ? r : []) {
    const nome = c.pushName || c.name;
    if (c.remoteJid && nome) nomes.set(c.remoteJid, nome);
  }
  return nomes;
}

export async function listarMensagens(instancia: string, jid: string, limite: number) {
  const r = await chamar<{ messages?: { records?: unknown[] } } | unknown[]>(`/chat/findMessages/${instancia}`, {
    method: "POST",
    body: JSON.stringify({ where: { key: { remoteJid: jid } }, page: 1, offset: limite }),
  });
  const registros = Array.isArray(r) ? r : (r.messages?.records ?? []);
  return registros.slice(0, limite);
}

// Baixa o arquivo de uma mensagem (foto, áudio...) que o servidor guardou.
export async function baixarMidia(instancia: string, waId: string) {
  return chamar<{ base64?: string; mimetype?: string; fileName?: string }>(
    `/chat/getBase64FromMediaMessage/${instancia}`,
    { method: "POST", body: JSON.stringify({ message: { key: { id: waId } }, convertToMp4: false }) },
  );
}

// Número comum vai só com os dígitos; contato identificado por código interno (@lid) vai completo.
const destino = (jid: string) => (jid.endsWith("@s.whatsapp.net") ? jid.split("@")[0] : jid);

type Enviada = { key?: { id?: string } };

export async function enviarMidia(
  instancia: string,
  jid: string,
  midia: { tipo: "image" | "video" | "document"; url: string; mimetype: string; nome: string; legenda?: string },
) {
  return chamar<Enviada>(`/message/sendMedia/${instancia}`, {
    method: "POST",
    body: JSON.stringify({
      number: destino(jid),
      mediatype: midia.tipo,
      mimetype: midia.mimetype,
      media: midia.url,
      fileName: midia.nome,
      caption: midia.legenda ?? "",
    }),
  });
}

// Áudio gravado vai como mensagem de voz (o servidor converte o formato).
export async function enviarAudio(instancia: string, jid: string, url: string) {
  return chamar<Enviada>(`/message/sendWhatsAppAudio/${instancia}`, {
    method: "POST",
    body: JSON.stringify({ number: destino(jid), audio: url, encoding: true }),
  });
}

export async function enviarFigurinha(instancia: string, jid: string, url: string) {
  return chamar<Enviada>(`/message/sendSticker/${instancia}`, {
    method: "POST",
    body: JSON.stringify({ number: destino(jid), sticker: url }),
  });
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
  return chamar<Enviada>(`/message/sendText/${instancia}`, {
    method: "POST",
    body: JSON.stringify({ number: destino(jid), text: texto }),
  });
}

// Confere se o número tem WhatsApp e devolve o código certo (resolve o 9º dígito do Brasil).
export async function verificarNumero(instancia: string, numero: string) {
  const r = await chamar<{ exists?: boolean; jid?: string }[]>(`/chat/whatsappNumbers/${instancia}`, {
    method: "POST",
    body: JSON.stringify({ numbers: [numero] }),
  });
  const item = Array.isArray(r) ? r[0] : undefined;
  return { existe: Boolean(item?.exists), jid: item?.jid };
}
