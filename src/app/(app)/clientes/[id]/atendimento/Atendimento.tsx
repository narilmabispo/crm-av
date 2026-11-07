import { hoje } from "@/lib/datas";
import type { Etiqueta } from "@/lib/etiquetas";
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

  const [{ data: conversas }, { data: etiquetas }, { data: marcadas }] = await Promise.all([
    supabase
      .from("conversas")
      .select("id, jid, nome, ultima_mensagem, ultima_em, nao_lidas")
      .eq("cliente_id", clienteId)
      .order("ultima_em", { ascending: false, nullsFirst: false })
      .limit(200),
    supabase.from("etiquetas").select("id, nome, cor").order("criado_em"),
    supabase
      .from("conversa_etiquetas")
      .select("conversa_id, etiqueta_id, conversa:conversas!inner(cliente_id)")
      .eq("conversa.cliente_id", clienteId),
  ]);

  const marcacoes: Record<string, string[]> = {};
  for (const m of marcadas ?? []) (marcacoes[m.conversa_id] ??= []).push(m.etiqueta_id);

  const selecionada = (conversas ?? []).find((c) => c.id === conversaId) ?? null;
  let mensagens: Mensagem[] = [];
  if (selecionada) {
    const { data } = await supabase
      .from("mensagens")
      .select("id, de_mim, tipo, texto, midia_nome, enviada_em")
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
      etiquetas={(etiquetas ?? []) as Etiqueta[]}
      marcacoes={marcacoes}
      hoje={hoje()}
    />
  );
}
