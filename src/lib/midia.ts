import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { baixarMidia } from "@/lib/evolution";

const EXTENSOES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/webm": "webm",
  "application/pdf": "pdf",
};

export type MensagemComMidia = {
  id: string;
  wa_id: string;
  assistente_id: string;
  midia_path: string | null;
  midia_mimetype: string | null;
  cliente_id: string;
};

// Garante que o arquivo da mensagem está guardado no Supabase: na primeira vez,
// baixa do servidor do WhatsApp. Devolve o caminho do arquivo ou null se não houver.
export async function garantirArquivo(admin: ReturnType<typeof createAdminClient>, msg: MensagemComMidia) {
  if (msg.midia_path) return msg.midia_path;

  let arquivo: { base64?: string; mimetype?: string };
  try {
    arquivo = await baixarMidia(`av-${msg.cliente_id}`, msg.wa_id);
  } catch (e) {
    console.error("baixarMidia", e);
    return null;
  }
  if (!arquivo.base64) return null;

  const mimetype = (arquivo.mimetype || msg.midia_mimetype || "application/octet-stream").split(";")[0];
  const caminho = `${msg.assistente_id}/recebidas/${msg.id}.${EXTENSOES[mimetype] ?? "bin"}`;
  const { error } = await admin.storage
    .from("midias")
    .upload(caminho, Buffer.from(arquivo.base64, "base64"), { contentType: mimetype, upsert: true });
  if (error) {
    console.error("upload midia", error);
    return null;
  }
  await admin.from("mensagens").update({ midia_path: caminho, midia_mimetype: mimetype }).eq("id", msg.id);
  return caminho;
}

export async function linkTemporario(admin: ReturnType<typeof createAdminClient>, caminho: string, segundos = 3600) {
  const { data } = await admin.storage.from("midias").createSignedUrl(caminho, segundos);
  return data?.signedUrl ?? null;
}
