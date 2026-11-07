import { Icone } from "@/components/Icone";
import { carregarConta } from "@/lib/conta";
import { dataLonga, dinheiro } from "@/lib/datas";
import { iniciais } from "@/lib/whatsapps";
import { FormPerfil, type DadosPerfil } from "./FormPerfil";

const STATUS: Record<string, { nome: string; cor: string }> = {
  teste: { nome: "Período de teste", cor: "bg-sky-100 text-sky-800" },
  ativa: { nome: "Ativa", cor: "bg-emerald-100 text-emerald-800" },
  atrasada: { nome: "Pagamento atrasado", cor: "bg-red-100 text-red-800" },
  cancelada: { nome: "Cancelada", cor: "bg-gray-100 text-gray-700" },
};

type Plano = {
  id: string;
  nome: string;
  limite_clientes: number;
  preco_centavos: number;
  descricao: string | null;
  recursos: string[] | null;
};

const preco = (p: Plano) => (p.preco_centavos > 0 ? `${dinheiro(p.preco_centavos)}/mês` : "Preço a definir");

export default async function Perfil() {
  const { supabase, user, nome, totalClientes, limite } = await carregarConta();
  const [{ data: assistente }, { data: assinatura }, { data: planos }] = await Promise.all([
    supabase.from("assistentes").select("*").eq("id", user.id).single(),
    supabase.from("assinaturas").select("status, proxima_cobranca, criado_em, plano_id").eq("assistente_id", user.id).single(),
    supabase.from("planos").select("*").order("limite_clientes"),
  ]);

  const dados: DadosPerfil = {
    nome: assistente?.nome || "",
    telefone: assistente?.telefone ?? null,
    cidade: assistente?.cidade ?? null,
    documento: assistente?.documento ?? null,
    instagram: assistente?.instagram ?? null,
  };
  const lista = (planos ?? []) as Plano[];
  const plano = lista.find((p) => p.id === assinatura?.plano_id);
  const status = STATUS[assinatura?.status ?? ""] ?? STATUS.cancelada;
  const porcentagem = limite > 0 ? Math.min(100, Math.round((totalClientes / limite) * 100)) : 0;

  return (
    <>
      <div className="mb-8 flex items-center gap-4">
        <span className="titulo flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lilas to-marca text-xl font-bold text-white shadow-md">
          {iniciais(nome)}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-tinta">Meu perfil</h1>
          <p className="text-gray-600">Seus dados e as informações do seu plano.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="cartao p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-tinta">
            <Icone nome="usuario" className="h-5 w-5 text-marca" /> Dados da AV
          </h2>
          <FormPerfil dados={dados} email={user.email ?? ""} />
        </section>

        <section id="financeiro" className="scroll-mt-6 space-y-4">
          <div className="rounded-2xl border border-orange-100 bg-creme p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-600">Seu plano</p>
                <p className="titulo text-xl font-bold text-tinta">{plano?.nome ?? "Sem plano"}</p>
              </div>
              <Icone nome="coroa" className="h-7 w-7 text-laranja" />
            </div>
            {plano?.descricao && <p className="mt-2 text-sm text-gray-700">{plano.descricao}</p>}
            <p className="titulo mt-4 text-2xl font-bold text-tinta">{plano ? preco(plano) : "—"}</p>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-600">Situação</dt>
                <dd>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.cor}`}>{status.nome}</span>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-600">Próxima cobrança</dt>
                <dd className="font-medium">{assinatura?.proxima_cobranca ? dataLonga(assinatura.proxima_cobranca) : "A definir"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-600">Cliente desde</dt>
                <dd className="font-medium">{assinatura?.criado_em ? dataLonga(assinatura.criado_em.slice(0, 10)) : "—"}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <p className="text-sm text-gray-600">
                {totalClientes} de {limite} clientes usados
              </p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-orange-100">
                <div className="h-full rounded-full bg-laranja" style={{ width: `${porcentagem}%` }} />
              </div>
            </div>

            {(plano?.recursos?.length ?? 0) > 0 && (
              <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
                {plano!.recursos!.map((r) => (
                  <li key={r} className="flex items-start gap-2">
                    <Icone nome="check" className="mt-0.5 h-4 w-4 shrink-0 text-laranja" /> {r}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="cartao p-5 text-sm">
            <h3 className="mb-3 font-semibold text-tinta">Planos disponíveis</h3>
            <ul className="space-y-3">
              {lista.map((p) => (
                <li
                  key={p.id}
                  className={`rounded-xl border p-4 ${p.id === plano?.id ? "border-marca bg-lavanda" : "border-gray-200"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{p.nome}</p>
                    {p.id === plano?.id && <span className="text-xs font-semibold text-marca-escura">Seu plano</span>}
                  </div>
                  <p className="text-gray-600">
                    Até {p.limite_clientes} clientes · {preco(p)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="cartao p-5 text-sm">
            <h3 className="mb-1 font-semibold text-tinta">Histórico de pagamentos</h3>
            <p className="text-gray-500">Os pagamentos vão aparecer aqui quando a cobrança automática for ligada.</p>
          </div>
        </section>
      </div>
    </>
  );
}
