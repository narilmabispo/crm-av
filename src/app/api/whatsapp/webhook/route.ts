import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { salvarMensagens } from "@/lib/salvar-mensagens";

// Recebe os avisos da Evolution API: QR Code novo, mudança de conexão e mensagens.
export async function POST(request: NextRequest) {
  if (request.nextUrl.searchParams.get("token") !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const corpo = await request.json();
  const evento = String(corpo.event ?? "").toLowerCase().replaceAll("_", ".");
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

  // messages.upsert: recebidas e enviadas pelo celular; send.message: enviadas pela API.
  if (evento === "messages.upsert" || evento === "send.message") {
    const lista = Array.isArray(corpo.data) ? corpo.data : [corpo.data];
    await salvarMensagens(supabase, conexao, lista);
  }

  return NextResponse.json({ ok: true });
}
