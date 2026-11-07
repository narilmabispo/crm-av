import { carregarConta } from "@/lib/conta";
import { hoje as dataDeHoje, somarDias } from "@/lib/datas";
import { FormTarefa } from "./FormTarefa";
import { ListaTarefas, type Tarefa } from "./ListaTarefas";

type Props = { searchParams: Promise<{ cliente?: string }> };

export default async function Tarefas({ searchParams }: Props) {
  const { cliente: filtroCliente } = await searchParams;
  const { supabase } = await carregarConta();
  const hoje = dataDeHoje();

  let consulta = supabase
    .from("tarefas")
    .select("id, titulo, vence_em, feita, cliente_id, conversa_id, cliente:clientes(nome)")
    .or(`feita.eq.false,feita_em.gte.${somarDias(hoje, -7)}`)
    .order("vence_em", { ascending: true, nullsFirst: false })
    .order("criado_em")
    .limit(500);
  if (filtroCliente) consulta = consulta.eq("cliente_id", filtroCliente);

  const [{ data }, { data: clientes }] = await Promise.all([
    consulta,
    supabase.from("clientes").select("id, nome").order("nome"),
  ]);
  const tarefas = (data ?? []) as unknown as Tarefa[];

  const abertas = tarefas.filter((t) => !t.feita);
  const grupos = [
    { titulo: "Atrasadas", itens: abertas.filter((t) => t.vence_em && t.vence_em < hoje), destaque: "atrasada" as const },
    { titulo: "Hoje", itens: abertas.filter((t) => t.vence_em === hoje) },
    { titulo: "Próximos dias", itens: abertas.filter((t) => t.vence_em && t.vence_em > hoje) },
    { titulo: "Sem data", itens: abertas.filter((t) => !t.vence_em) },
    { titulo: "Feitas nos últimos 7 dias", itens: tarefas.filter((t) => t.feita) },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tinta">Tarefas</h1>
          <p className="text-gray-600">Anote o que precisa fazer por cliente. As tarefas do dia aparecem também no Início.</p>
        </div>
        <form className="flex items-center gap-2 text-sm">
          <select name="cliente" defaultValue={filtroCliente ?? ""} className="campo w-auto">
            <option value="">Todos os clientes</option>
            {(clientes ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <button className="botao-secundario">Filtrar</button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {tarefas.length === 0 && (
            <div className="cartao p-8 text-center text-gray-600">
              Nenhuma tarefa por aqui. Adicione a primeira ao lado, ou crie um lembrete direto numa conversa.
            </div>
          )}
          {grupos
            .filter((g) => g.itens.length > 0)
            .map((g) => (
              <section key={g.titulo}>
                <h2 className={`mb-2 font-semibold ${g.destaque ? "text-red-600" : "text-tinta"}`}>
                  {g.titulo} <span className="font-normal text-gray-400">({g.itens.length})</span>
                </h2>
                <ListaTarefas tarefas={g.itens} hoje={hoje} />
              </section>
            ))}
        </div>
        <div>
          <FormTarefa clientes={clientes ?? []} hoje={hoje} />
        </div>
      </div>
    </>
  );
}
