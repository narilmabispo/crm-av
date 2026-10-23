// Converte a mensagem recebida da Evolution API num tipo e num texto para exibir no chat.

type Conteudo = Record<string, { caption?: string; text?: string } | string | undefined>;

const ROTULOS: Record<string, string> = {
  imageMessage: "imagem",
  videoMessage: "vídeo",
  audioMessage: "áudio",
  documentMessage: "documento",
  stickerMessage: "figurinha",
  locationMessage: "localização",
  contactMessage: "contato",
};

export function lerConteudo(message: Conteudo | undefined): { tipo: string; texto: string } {
  if (!message) return { tipo: "outro", texto: "[mensagem]" };
  if (typeof message.conversation === "string") return { tipo: "texto", texto: message.conversation };

  const estendida = message.extendedTextMessage;
  if (estendida && typeof estendida === "object" && estendida.text) return { tipo: "texto", texto: estendida.text };

  for (const [chave, rotulo] of Object.entries(ROTULOS)) {
    const midia = message[chave];
    if (midia) {
      const legenda = typeof midia === "object" ? midia.caption : undefined;
      return { tipo: rotulo, texto: legenda ? `[${rotulo}] ${legenda}` : `[${rotulo}]` };
    }
  }
  return { tipo: "outro", texto: "[mensagem]" };
}

// Só atendemos conversas individuais: grupos, status e canais ficam de fora.
export function ehConversaIndividual(jid: string) {
  return jid.endsWith("@s.whatsapp.net") || jid.endsWith("@lid");
}
