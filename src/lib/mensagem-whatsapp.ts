// Converte a mensagem recebida da Evolution API num tipo e num texto para exibir no chat.

type Midia = { caption?: string; text?: string; mimetype?: string; fileName?: string; title?: string };
type Conteudo = Record<string, Midia | string | undefined | Record<string, unknown>>;

export type ConteudoLido = {
  tipo: string;
  texto: string;
  mimetype?: string;
  nome?: string;
};

// Tipos que têm arquivo para baixar e mostrar no chat.
export const TIPOS_MIDIA = ["imagem", "vídeo", "áudio", "documento", "figurinha"];

const ROTULOS: Record<string, string> = {
  imageMessage: "imagem",
  videoMessage: "vídeo",
  ptvMessage: "vídeo",
  audioMessage: "áudio",
  documentMessage: "documento",
  stickerMessage: "figurinha",
  locationMessage: "localização",
  liveLocationMessage: "localização",
  contactMessage: "contato",
  contactsArrayMessage: "contato",
  pollCreationMessage: "enquete",
  pollCreationMessageV3: "enquete",
};

// Prévia curta para a lista de conversas.
export const PREVIA: Record<string, string> = {
  imagem: "📷 Foto",
  "vídeo": "🎥 Vídeo",
  "áudio": "🎤 Áudio",
  documento: "📄 Documento",
  figurinha: "🌟 Figurinha",
  "localização": "📍 Localização",
  contato: "👤 Contato",
  enquete: "📊 Enquete",
};

// Mensagens que não aparecem no chat do WhatsApp (reações, avisos técnicos, edições).
const IGNORAR = [
  "reactionMessage",
  "protocolMessage",
  "senderKeyDistributionMessage",
  "messageContextInfo",
  "editedMessage",
  "pollUpdateMessage",
  "keepInChatMessage",
];

// Algumas mensagens vêm "embrulhadas" (temporárias, visualização única, documento com legenda).
function desembrulhar(message: Conteudo): Conteudo {
  for (const chave of ["ephemeralMessage", "viewOnceMessage", "viewOnceMessageV2", "viewOnceMessageV2Extension", "documentWithCaptionMessage"]) {
    const embrulho = message[chave] as { message?: Conteudo } | undefined;
    if (embrulho?.message) return desembrulhar(embrulho.message);
  }
  return message;
}

export function lerConteudo(bruta: Conteudo | undefined): ConteudoLido | null {
  if (!bruta) return { tipo: "outro", texto: "[mensagem]" };
  const message = desembrulhar(bruta);
  if (typeof message.conversation === "string") return { tipo: "texto", texto: message.conversation };

  const estendida = message.extendedTextMessage as Midia | undefined;
  if (estendida && typeof estendida === "object" && estendida.text) return { tipo: "texto", texto: estendida.text };

  for (const [chave, tipo] of Object.entries(ROTULOS)) {
    const midia = message[chave] as Midia | undefined;
    if (midia) {
      return {
        tipo,
        texto: midia.caption ?? "",
        mimetype: midia.mimetype,
        nome: midia.fileName ?? midia.title,
      };
    }
  }

  const chaves = Object.keys(message);
  if (chaves.length && chaves.every((c) => IGNORAR.includes(c))) return null;
  return { tipo: "outro", texto: "[mensagem não suportada]" };
}

// Texto para a lista de conversas: legenda ou a prévia do tipo.
export function resumo(tipo: string, texto: string | null) {
  if (texto) return PREVIA[tipo] ? `${PREVIA[tipo]}: ${texto}` : texto;
  return PREVIA[tipo] ?? "[mensagem]";
}

// Só atendemos conversas individuais: grupos, status e canais ficam de fora.
export function ehConversaIndividual(jid: string) {
  return jid.endsWith("@s.whatsapp.net") || jid.endsWith("@lid");
}
