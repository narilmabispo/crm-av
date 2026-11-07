import { carregarConta } from "@/lib/conta";
import { hoje, limitesDoMes, mesAnterior, nomeDoMes } from "@/lib/datas";
import { ResumoParaCliente } from "./ResumoParaCliente";

type Props = { searchParams: Promise<{ mes?: string; cliente?: string }> };

type Linha = {
  cliente_id: string;
  dia: string | null;
  conversas: number;
  atendidas: number;
  recebidas: number;
  enviadas: number;
  respostas: number;
  soma_resposta_seg: number;
};

type Totais = Omit<Linha, "cliente_id" | "dia">;

const ZERO: Totais = { conversas: 0, atendidas: 0, recebidas: 0, enviadas: 0, respostas: 0, soma_resposta_seg: 0 };

function somar(linhas: Totais[]): Totais {
  return linhas.reduce(
    (t, l) => ({
      conversas: t.conversas + l.conversas,
      atendidas: t.atendidas + l.atendidas,
      recebidas: t.recebidas + l.recebidas,
      enviadas: t.enviadas + l.enviadas,
      respostas: t.respostas + l.respostas,
      soma_resposta_seg: t.soma_resposta_seg + Number(l.soma_resposta_seg),
    }),
    ZERO,
  );
}

// 754 segundos -> "12 min"
function tempoMedio(t: Totais) {
  if (!t.respostas) return "—";
  const seg = Number(t.soma_resposta_seg) / t.respostas;
  if (seg < 60) return `${Math.round(seg)} s`;
  if (seg < 3600) return `${Math.round(seg / 60)} min`;
  const h = Math.floor(seg / 3600);
  const min = Math.round((seg % 3600) / 60);
  return min ? `${h} h ${min} min` : `${h} h`;
}

function Numero({ valor, rotulo, detalhe }: { valor: string | number; rotulo: string; detalhe?: string }) {
  return (
    <div className="cartao p-5">
      <p className="text-sm text-gray-600">{rotulo}</p>
      <p className="titulo mt-1 text-3xl font-bold text-tinta">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-gray-500">{detalhe}</p>}
    </div>
  );
}

export default async function Relatorios({ searchParams }: Props) {
  const params = await searchParams;
  const mesAtual = hoje().slice(0, 7);
  const mes = /^\d{4}-\d{2}$/.test(params.mes ?? "") ? params.mes! : mesAtual;
  const { supabase, nome } = await carregarConta();
  const { inicio, fim } = limitesDoMes(mes);

  const [{ data: clientes }, { data, error }] = await Promise.all([
    supabase.from("clientes").select("id, nome").order("nome"),
    supabase.rpc("relatorio_atendimentos", { p_inicio: inicio, p_fim: fim }),
  ]);
  const listaClientes = clientes ?? [];
  const cliente = listaClientes.find((c) => c.id === params.cliente);
  const linhas = ((data ?? []) as Linha[]).filter((l) => !cliente || l.cliente_id === cliente.id);

  const totaisPorCliente = linhas.filter((l) => l.dia === null);
  const total = somar(totaisPorCliente);

  // Conversas atendidas por dia, todos os dias do mês (até hoje, no mês atual).
  const diasNoMes = new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0).getDate();
  const ultimoDia = mes === mesAtual ? Number(hoje().slice(8, 10)) : diasNoMes;
  const porDia = Array.from({ length: ultimoDia }, (_, i) => {
    const dia = `${mes}-${String(i + 1).padStart(2, "0")}`;
    return { dia: i + 1, ...somar(linhas.filter((l) => l.dia === dia)) };
  });
  const maximo = Math.max(1, ...porDia.map((d) => d.atendidas));
  const diasComAtendimento = porDia.filter((d) => d.atendidas > 0).length;

  const meses = Array.from({ length: 12 }, (_, i) => mesAnterior(mesAtual, i));
  const nomeCliente = (id: string) => listaClientes.find((c) => c.id === id)?.nome ?? "Cliente";

  const resumo = [
    `Olá${cliente ? `, ${cliente.nome.split(" ")[0]}` : ""}! Segue o resumo dos atendimentos de ${nomeDoMes(mes).toLowerCase()}${
      mes === mesAtual ? " (até hoje)" : ""
    }:`,
    "",
    `💬 Conversas atendidas: ${total.atendidas}`,
    `📥 Mensagens recebidas: ${total.recebidas}`,
    `📤 Mensagens respondidas: ${total.enviadas}`,
    `⏱️ Tempo médio de resposta: ${tempoMedio(total)}`,
    `📅 Dias com atendimento: ${diasComAtendimento}`,
    "",
    `Qualquer dúvida, estou à disposição!`,
    nome.includes("@") ? "" : nome,
  ]
    .join("\n")
    .trim();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tinta">Relatórios</h1>
          <p className="text-gray-600">Veja como foram os atendimentos e mostre seu trabalho aos clientes.</p>
        </div>
        <form className="flex flex-wrap items-center gap-2 text-sm print:hidden">
          <select name="mes" defaultValue={mes} className="campo w-auto">
            {meses.map((m) => (
              <option key={m} value={m}>
                {nomeDoMes(m)}
              </option>
            ))}
          </select>
          <select name="cliente" defaultValue={cliente?.id ?? ""} className="campo w-auto">
            <option value="">Todos os clientes</option>
            {listaClientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <button className="botao-secundario">Ver</button>
        </form>
      </div>

      {error && (
        <p className="cartao mb-6 border-orange-200 bg-orange-50 p-4 text-sm text-laranja-escura">
          Os relatórios ainda não foram ativados no banco de dados. Rode o arquivo 0004 no Supabase (SQL Editor) e recarregue a página.
        </p>
      )}

      <p className="mb-3 text-sm font-medium text-gray-500">
        {nomeDoMes(mes)} · {cliente ? cliente.nome : "Todos os clientes"}
      </p>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Numero valor={total.atendidas} rotulo="Conversas atendidas" detalhe={`${total.conversas} com alguma mensagem`} />
        <Numero valor={total.recebidas} rotulo="Mensagens recebidas" />
        <Numero valor={total.enviadas} rotulo="Mensagens enviadas" />
        <Numero valor={tempoMedio(total)} rotulo="Tempo médio de resposta" detalhe="Respostas dadas em até 24 h" />
      </div>

      <section className="cartao mb-6 p-5">
        <h2 className="mb-4 font-semibold text-tinta">Conversas atendidas por dia</h2>
        <div className="flex h-40 items-end gap-[2px]" role="img" aria-label="Gráfico de conversas atendidas por dia">
          {porDia.map((d) => (
            <div key={d.dia} className="group relative flex h-full flex-1 items-end justify-center" title={`Dia ${d.dia}: ${d.atendidas} conversas`}>
              <div
                className="w-full max-w-6 rounded-t-[4px] bg-marca group-hover:bg-marca-escura"
                style={{ height: d.atendidas ? `${Math.max(3, (d.atendidas / maximo) * 100)}%` : "0" }}
              />
              <span className="pointer-events-none absolute -top-7 z-10 hidden rounded-md bg-tinta px-2 py-0.5 text-xs whitespace-nowrap text-white group-hover:block">
                Dia {d.dia}: {d.atendidas}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1 flex border-t border-gray-200 pt-1 text-[11px] text-gray-400">
          <span className="flex-1">1</span>
          <span>{ultimoDia}</span>
        </div>
      </section>

      {!cliente && totaisPorCliente.length > 0 && (
        <section className="cartao mb-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-3 py-3 text-right font-medium">Atendidas</th>
                <th className="px-3 py-3 text-right font-medium">Recebidas</th>
                <th className="px-3 py-3 text-right font-medium">Enviadas</th>
                <th className="px-5 py-3 text-right font-medium">Tempo médio</th>
              </tr>
            </thead>
            <tbody>
              {totaisPorCliente
                .sort((a, b) => b.atendidas - a.atendidas)
                .map((l) => (
                  <tr key={l.cliente_id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3">
                      <a href={`/relatorios?mes=${mes}&cliente=${l.cliente_id}`} className="font-medium text-marca-escura hover:underline">
                        {nomeCliente(l.cliente_id)}
                      </a>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{l.atendidas}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{l.recebidas}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{l.enviadas}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{tempoMedio(l)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}

      <ResumoParaCliente texto={resumo} />
    </>
  );
}
