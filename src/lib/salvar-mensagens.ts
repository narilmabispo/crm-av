import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { ehConversaIndividual, lerConteudo, resumo } from "@/lib/mensagem-whatsapp";

type Admin = ReturnType<typeof createAdminClient>;
export type Conexao = { cliente_id: string; assistente_id: string };

export type MensagemEvolution = {
  key?: {
    id?: string;
    remoteJid?: string;
    remoteJidAlt?: string;
    senderPn?: string;
    fromMe?: boolean;
  };
  pushName?: string;
  message?: Parameters<typeof lerConteudo>[0];
  messageTimestamp?: number | string;
};

// O WhatsApp às vezes identifica o contato por um código interno (@lid) e às vezes pelo número.
// Usamos o número sempre que ele vier junto, para a mesma pessoa não virar duas conversas
// e para a resposta ir para o número certo.
export function jidCanonico(key: MensagemEvolution["key"]): string {
  const jid = key?.remoteJid ?? "";
  if (jid.endsWith("@lid")) {
    const alternativo = [key?.remoteJidAlt, key?.senderPn].find((j) => j?.endsWith("@s.whatsapp.net"));
    if (alternativo) return alternativo;
  }
  return jid;
}

// Grava mensagens vindas da Evolution API (em tempo real ou do histórico) e atualiza as conversas.
export async function salvarMensagens(
  supabase: Admin,
  conexao: Conexao,
  lista: MensagemEvolution[],
  { historico = false, nomes = new Map<string, string>() } = {},
) {
  const porConversa = new Map<string, MensagemEvolution[]>();
  for (const m of lista) {
    const jid = jidCanonico(m?.key);
    if (!m?.key?.id || !ehConversaIndividual(jid)) continue;
    porConversa.set(jid, [...(porConversa.get(jid) ?? []), m]);
  }

  for (const [jid, mensagens] of porConversa) {
    const { data: existente } = await supabase
      .from("conversas")
      .select("id, nome, nao_lidas, ultima_em")
      .eq("cliente_id", conexao.cliente_id)
      .eq("jid", jid)
      .maybeSingle();

    let conversaId = existente?.id as string | undefined;
    if (!conversaId) {
      const { data: nova } = await supabase
        .from("conversas")
        .upsert(
          { cliente_id: conexao.cliente_id, assistente_id: conexao.assistente_id, jid },
          { onConflict: "cliente_id,jid" },
        )
        .select("id")
        .single();
      conversaId = nova?.id;
    }
    if (!conversaId) continue;

    const linhas = mensagens.flatMap((m) => {
      const conteudo = lerConteudo(m.message);
      if (!conteudo) return []; // reações e avisos técnicos não viram mensagem no chat
      const quando = m.messageTimestamp
        ? new Date(Number(m.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();
      return [
        {
          conversa_id: conversaId,
          assistente_id: conexao.assistente_id,
          wa_id: m.key!.id!,
          de_mim: Boolean(m.key!.fromMe),
          tipo: conteudo.tipo,
          texto: conteudo.texto,
          midia_mimetype: conteudo.mimetype ?? null,
          midia_nome: conteudo.nome ?? null,
          enviada_em: quando,
        },
      ];
    });
    if (!linhas.length) continue;

    const { data: inseridas } = await supabase
      .from("mensagens")
      .upsert(linhas, { onConflict: "conversa_id,wa_id", ignoreDuplicates: true })
      .select("de_mim, tipo, texto, enviada_em");

    const nomeContato =
      mensagens.find((m) => !m.key?.fromMe && m.pushName)?.pushName ||
      nomes.get(jid) ||
      nomes.get(mensagens[0]?.key?.remoteJid ?? "");

    // Nada novo (por exemplo, a mensagem que a própria plataforma acabou de enviar).
    // Ainda assim aproveita para preencher o nome de quem estava sem nome.
    if (!inseridas?.length) {
      if (!existente?.nome && nomeContato) await supabase.from("conversas").update({ nome: nomeContato }).eq("id", conversaId);
      continue;
    }

    const maisRecente = inseridas.reduce((a, b) => (b.enviada_em > a.enviada_em ? b : a));
    const novasRecebidas = historico ? 0 : inseridas.filter((m) => !m.de_mim).length;
    const ehMaisNova = !existente?.ultima_em || maisRecente.enviada_em >= existente.ultima_em;

    await supabase
      .from("conversas")
      .update({
        nome: existente?.nome || nomeContato || null,
        ...(ehMaisNova ? { ultima_mensagem: resumo(maisRecente.tipo, maisRecente.texto), ultima_em: maisRecente.enviada_em } : {}),
        nao_lidas: !historico && maisRecente.de_mim ? 0 : (existente?.nao_lidas ?? 0) + novasRecebidas,
      })
      .eq("id", conversaId);
  }
}
