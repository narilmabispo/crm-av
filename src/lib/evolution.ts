import "server-only";

// Cliente mínimo da Evolution API v2 (conexão do WhatsApp por QR Code).
// Tudo que fala com o WhatsApp passa por aqui, para facilitar trocar de provedor no futuro.

const EVENTOS = ["QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT"];

async function chamar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`${process.env.EVOLUTION_API_URL}${caminho}`, {
    ...init,
    headers: { "Content-Type": "application/json", apikey: process.env.EVOLUTION_API_KEY!, ...init.headers },
    cache: "no-store",
  });
  if (!resposta.ok) throw new Error(`Evolution API ${caminho}: ${resposta.status} ${await resposta.text()}`);
  return resposta.json() as Promise<T>;
}

export function urlWebhook() {
  return `${process.env.APP_URL}/api/whatsapp/webhook?token=${process.env.WEBHOOK_SECRET}`;
}

export async function criarInstancia(instancia: string) {
  return chamar<{ qrcode?: { base64?: string } }>("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName: instancia,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
      webhook: { url: urlWebhook(), byEvents: false, base64: true, events: EVENTOS },
    }),
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
  return chamar<{ key?: { id?: string } }>(`/message/sendText/${instancia}`, {
    method: "POST",
    body: JSON.stringify({ number: jid.split("@")[0], text: texto }),
  });
}
