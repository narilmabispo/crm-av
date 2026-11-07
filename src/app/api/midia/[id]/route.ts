import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { garantirArquivo, linkTemporario } from "@/lib/midia";

// Entrega o arquivo de uma mensagem (foto, áudio, figurinha...) por um link temporário.
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // As regras do banco garantem que a assistente só acessa mensagens dela.
  const { data: msg } = await supabase
    .from("mensagens")
    .select("id, wa_id, assistente_id, midia_path, midia_mimetype, conversa:conversas(cliente_id)")
    .eq("id", id)
    .single();
  if (!msg) return NextResponse.json({ erro: "não encontrada" }, { status: 404 });

  const admin = createAdminClient();
  const caminho = await garantirArquivo(admin, {
    ...msg,
    cliente_id: (msg.conversa as unknown as { cliente_id: string }).cliente_id,
  });
  if (!caminho) return NextResponse.json({ erro: "arquivo indisponível no WhatsApp" }, { status: 404 });

  const link = await linkTemporario(admin, caminho);
  if (!link) return NextResponse.json({ erro: "arquivo não encontrado" }, { status: 404 });
  return NextResponse.redirect(link, { headers: { "Cache-Control": "private, max-age=3000" } });
}
