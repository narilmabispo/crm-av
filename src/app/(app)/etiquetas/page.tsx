import Link from "next/link";
import { Icone } from "@/components/Icone";
import { carregarConta } from "@/lib/conta";
import { corDaEtiqueta, ETIQUETAS_SUGERIDAS, type Etiqueta } from "@/lib/etiquetas";
import { atualizarEtiqueta, criarEtiquetasSugeridas, excluirEtiqueta } from "./actions";
import { FormNovaEtiqueta } from "./FormNovaEtiqueta";
import { SeletorCor } from "./SeletorCor";

type Props = { searchParams: Promise<{ etiqueta?: string }> };

type Marcacao = {
  etiqueta_id: string;
  conversa: { id: string; jid: string; nome: string | null; ultima_mensagem: string | null; cliente: { id: string; nome: string } | null } | null;
};

const tituloConversa = (c: { jid: string; nome: string | null }) =>
  c.nome || (c.jid.endsWith("@lid") ? "Contato sem nome" : "+" + c.jid.split("@")[0]);

export default async function Etiquetas({ searchParams }: Props) {
  const { etiqueta: filtro } = await searchParams;
  const { supabase } = await carregarConta();
  const [{ data: etiquetas }, { data: marcacoes }] = await Promise.all([
    supabase.from("etiquetas").select("id, nome, cor").order("criado_em"),
    supabase
      .from("conversa_etiquetas")
      .select("etiqueta_id, conversa:conversas(id, jid, nome, ultima_mensagem, cliente:clientes(id, nome))")
      .limit(1000),
  ]);
  const lista = (etiquetas ?? []) as Etiqueta[];
  const todas = (marcacoes ?? []) as unknown as Marcacao[];
  const total = (id: string) => todas.filter((m) => m.etiqueta_id === id).length;
  const selecionada = lista.find((e) => e.id === filtro);
  const conversas = selecionada ? todas.filter((m) => m.etiqueta_id === selecionada.id && m.conversa) : [];

  return (
    <>
      <h1 className="text-2xl font-bold text-tinta">Etiquetas</h1>
      <p className="mb-6 text-gray-600">
        Crie etiquetas coloridas e coloque nas conversas pelo chat de cada cliente. Clique numa etiqueta para ver as conversas
        marcadas com ela.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {lista.length === 0 ? (
            <div className="cartao flex flex-col items-center p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lavanda text-marca">
                <Icone nome="etiquetas" className="h-7 w-7" />
              </span>
              <p className="mt-3 text-gray-600">Você ainda não tem etiquetas. Quer começar com as mais usadas?</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {ETIQUETAS_SUGERIDAS.map((e) => (
                  <span key={e.nome} className={`rounded-full px-3 py-1 text-sm font-medium ${corDaEtiqueta(e.cor).chip}`}>
                    {e.nome}
                  </span>
                ))}
              </div>
              <form action={criarEtiquetasSugeridas} className="mt-5">
                <button className="botao">Criar essas etiquetas</button>
              </form>
            </div>
          ) : (
            <ul className="cartao divide-y divide-gray-100">
              {lista.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <Link
                    href={e.id === filtro ? "/etiquetas" : `/etiquetas?etiqueta=${e.id}`}
                    className={`rounded-full px-3 py-1 text-sm font-medium ${corDaEtiqueta(e.cor).chip} ${
                      e.id === filtro ? "ring-2 ring-tinta/40" : ""
                    }`}
                  >
                    {e.nome}
                  </Link>
                  <span className="flex-1 text-sm text-gray-500">
                    {total(e.id) === 1 ? "1 conversa" : `${total(e.id)} conversas`}
                  </span>
                  <details className="relative">
                    <summary className="cursor-pointer rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-lavanda">Editar</summary>
                    <div className="absolute right-0 z-10 mt-2 w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
                      <form action={atualizarEtiqueta.bind(null, e.id)} className="space-y-3">
                        <input name="nome" defaultValue={e.nome} required maxLength={40} className="campo" />
                        <SeletorCor atual={e.cor} />
                        <button className="botao w-full">Salvar</button>
                      </form>
                      <form action={excluirEtiqueta.bind(null, e.id)} className="mt-2 text-center">
                        <button className="text-sm text-red-600 hover:underline">Excluir etiqueta</button>
                      </form>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}

          {selecionada && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-tinta">
                Conversas com
                <span className={`rounded-full px-3 py-0.5 text-sm ${corDaEtiqueta(selecionada.cor).chip}`}>{selecionada.nome}</span>
              </h2>
              {conversas.length === 0 ? (
                <p className="cartao p-5 text-sm text-gray-500">
                  Nenhuma conversa com essa etiqueta ainda. Abra um chat e toque em &quot;Etiquetas&quot; no topo da conversa.
                </p>
              ) : (
                <ul className="cartao divide-y divide-gray-100">
                  {conversas.map(({ conversa: c }) => (
                    <li key={c!.id}>
                      <Link
                        href={`/clientes/${c!.cliente?.id}?aba=atendimento&conversa=${c!.id}`}
                        className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-lavanda/50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{tituloConversa(c!)}</p>
                          <p className="truncate text-sm text-gray-500">{c!.ultima_mensagem}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-lavanda px-2.5 py-0.5 text-xs text-marca-escura">
                          {c!.cliente?.nome}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <FormNovaEtiqueta />
      </div>
    </>
  );
}
