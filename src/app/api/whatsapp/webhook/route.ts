import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ehConversaIndividual, lerConteudo } from "@/lib/mensagem-whatsapp";

// Recebe os avisos da Evolution API: QR Code novo, mudança de conexão e mensagens.
export async function POST(request: NextRequest) {
  if (request.nextUrl.searchParams.get("token") !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const corpo = await request.json();
  const evento = String(corpo.event ?? "").toLowerCase().replace("_", ".");
  const supabase = createAdminClient();

  const { data: conexao } = await supabase
    .from("conexoes_whatsapp")
    .select("id, cliente_id, assistente_id")
    .eq("instancia", corpo.instance)
    .single();
  if (!conexao) return NextResponse.json({ ok: true });

  const agora = new Date().toISOString();

  if (evento === "qrcode.updated") {
    await supabase
      .from("conexoes_whatsapp")
      .update({ status: "aguardando_qr", qr_code: corpo.data?.qrcode?.base64 ?? null, atualizado_em: agora })
      .eq("id", conexao.id);
  }

  if (evento === "connection.update") {
    const estado = corpo.data?.state;
    if (estado === "open") {
      await supabase
        .from("conexoes_whatsapp")
        .update({
          status: "conectado",
          qr_code: null,
          numero: String(corpo.data?.wuid ?? "").split("@")[0] || null,
          atualizado_em: agora,
        })
        .eq("id", conexao.id);
    } else if (estado === "close") {
      await supabase
        .from("conexoes_whatsapp")
        .update({ status: "desconectado", qr_code: null, atualizado_em: agora })
        .eq("id", conexao.id);
    }
  }

  if (evento === "messages.upsert") {
    const lista = Array.isArray(corpo.data) ? corpo.data : [corpo.data];
    for (const m of lista) await salvarMensagem(supabase, conexao, m);
  }

  return NextResponse.json({ ok: true });
}

type Conexao = { cliente_id: string; assistente_id: string };

type MensagemEvolution = {
  key?: { id?: string; remoteJid?: string; fromMe?: boolean };
  pushName?: string;
  message?: Parameters<typeof lerConteudo>[0];
  messageTimestamp?: number | string;
};

async function salvarMensagem(supabase: ReturnType<typeof createAdminClient>, conexao: Conexao, m: MensagemEvolution) {
  const jid: string = m?.key?.remoteJid ?? "";
  if (!m?.key?.id || !ehConversaIndividual(jid)) return;

  const deMim = Boolean(m.key!.fromMe);
  const { tipo, texto } = lerConteudo(m.message);
  const quando = m.messageTimestamp ? new Date(Number(m.messageTimestamp) * 1000).toISOString() : new Date().toISOString();

  const { data: existente } = await supabase
    .from("conversas")
    .select("id, nome, nao_lidas")
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
  if (!conversaId) return;

  const { data: inserida } = await supabase
    .from("mensagens")
    .upsert(
      {
        conversa_id: conversaId,
        assistente_id: conexao.assistente_id,
        wa_id: m.key!.id,
        de_mim: deMim,
        tipo,
        texto,
        enviada_em: quando,
      },
      { onConflict: "conversa_id,wa_id", ignoreDuplicates: true },
    )
    .select("id");

  // Mensagem repetida (por exemplo, a que a própria plataforma enviou): não mexe na conversa.
  if (!inserida?.length) return;

  await supabase
    .from("conversas")
    .update({
      nome: !deMim && m.pushName ? m.pushName : existente?.nome ?? null,
      ultima_mensagem: texto,
      ultima_em: quando,
      nao_lidas: deMim ? 0 : (existente?.nao_lidas ?? 0) + 1,
    })
    .eq("id", conversaId);
}
