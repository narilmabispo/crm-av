import type { SupabaseClient } from "@supabase/supabase-js";

export type StatusConexao = "conectado" | "aguardando_qr" | "desconectado";

export type ResumoWhatsapp = {
  id: string;
  nome: string;
  detalhe: string;
  status: StatusConexao;
  numero: string | null;
  naoLidas: number;
};

// Cada cliente da assistente tem (ou terá) um WhatsApp. Junta cliente + conexão + conversas não lidas.
export async function carregarWhatsapps(supabase: SupabaseClient): Promise<ResumoWhatsapp[]> {
  const [{ data: clientes }, { data: conexoes }, { data: naoLidas }] = await Promise.all([
    supabase.from("clientes").select("id, nome, profissao, empresa").order("criado_em"),
    supabase.from("conexoes_whatsapp").select("cliente_id, status, numero"),
    supabase.from("conversas").select("cliente_id").gt("nao_lidas", 0),
  ]);

  const conexaoPorCliente = new Map((conexoes ?? []).map((c) => [c.cliente_id as string, c]));
  const contagem = new Map<string, number>();
  for (const c of naoLidas ?? []) contagem.set(c.cliente_id, (contagem.get(c.cliente_id) ?? 0) + 1);

  return (clientes ?? []).map((c) => {
    const conexao = conexaoPorCliente.get(c.id);
    return {
      id: c.id,
      nome: c.nome,
      detalhe: [c.profissao, c.empresa].filter(Boolean).join(" · "),
      status: (conexao?.status as StatusConexao) ?? "desconectado",
      numero: conexao?.numero ?? null,
      naoLidas: contagem.get(c.id) ?? 0,
    };
  });
}

// 5571988881122 -> +55 71 9 8888-1122
export function formatarNumero(numero: string | null) {
  if (!numero) return null;
  const n = numero.replace(/\D/g, "");
  if (n.startsWith("55") && n.length === 13) return `+55 ${n.slice(2, 4)} ${n[4]} ${n.slice(5, 9)}-${n.slice(9)}`;
  if (n.startsWith("55") && n.length === 12) return `+55 ${n.slice(2, 4)} ${n.slice(4, 8)}-${n.slice(8)}`;
  return `+${n}`;
}

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase() || "?";
}

const CORES_AVATAR = [
  "bg-violet-100 text-violet-700",
  "bg-orange-100 text-orange-700",
  "bg-emerald-100 text-emerald-700",
  "bg-pink-100 text-pink-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-800",
];

export function corAvatar(texto: string) {
  let soma = 0;
  for (const ch of texto) soma = (soma + ch.charCodeAt(0)) % 997;
  return CORES_AVATAR[soma % CORES_AVATAR.length];
}
