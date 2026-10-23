import { createClient } from "@/lib/supabase/server";
import { ConectarWhatsapp } from "./ConectarWhatsapp";
import { Inbox, type Conversa, type Mensagem } from "./Inbox";

type Props = { clienteId: string; nomeCliente: string; conversaId?: string };

export async function Atendimento({ clienteId, nomeCliente, conversaId }: Props) {
  const supabase = await createClient();
  const { data: conexao } = await supabase
    .from("conexoes_whatsapp")
    .select("status, qr_code, numero")
    .eq("cliente_id", clienteId)
    .maybeSingle();

  if (conexao?.status !== "conectado") {
    return <ConectarWhatsapp clienteId={clienteId} nomeCliente={nomeCliente} conexao={conexao} />;
  }

  const { data: conversas } = await supabase
    .from("conversas")
    .select("id, jid, nome, ultima_mensagem, ultima_em, nao_lidas")
    .eq("cliente_id", clienteId)
    .order("ultima_em", { ascending: false, nullsFirst: false })
    .limit(200);

  const selecionada = (conversas ?? []).find((c) => c.id === conversaId) ?? null;
  let mensagens: Mensagem[] = [];
  if (selecionada) {
    const { data } = await supabase
      .from("mensagens")
      .select("id, de_mim, texto, enviada_em")
      .eq("conversa_id", selecionada.id)
      .order("enviada_em", { ascending: false })
      .limit(100);
    mensagens = (data ?? []).reverse();
  }

  return (
    <Inbox
      clienteId={clienteId}
      numero={conexao.numero}
      conversas={(conversas ?? []) as Conversa[]}
      selecionada={selecionada as Conversa | null}
      mensagens={mensagens}
    />
  );
}
