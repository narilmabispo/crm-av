import Link from "next/link";
import { dataCurta } from "@/lib/datas";
import { excluirTarefa, marcarTarefa } from "./actions";

export type Tarefa = {
  id: string;
  titulo: string;
  vence_em: string | null;
  feita: boolean;
  cliente_id: string | null;
  conversa_id: string | null;
  cliente: { nome: string } | null;
};

// Lista de tarefas com o botão redondo de "feita" e o link para a conversa, quando houver.
export function ListaTarefas({ tarefas, hoje }: { tarefas: Tarefa[]; hoje: string }) {
  return (
    <ul className="cartao divide-y divide-gray-100">
      {tarefas.map((t) => (
        <li key={t.id} className="group flex items-start gap-3 px-4 py-3">
          <form action={marcarTarefa.bind(null, t.id, !t.feita)}>
            <button
              className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                t.feita ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300 hover:border-emerald-500"
              }`}
              aria-label={t.feita ? "Marcar como não feita" : "Marcar como feita"}
              title={t.feita ? "Desfazer" : "Marcar como feita"}
            >
              {t.feita && (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path d="m5 12 5 5 9-10" />
                </svg>
              )}
            </button>
          </form>
          <div className="min-w-0 flex-1">
            <p className={t.feita ? "text-gray-400 line-through" : "text-gray-900"}>{t.titulo}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              {t.vence_em && (
                <span className={t.vence_em < hoje && !t.feita ? "font-medium text-red-600" : ""}>
                  {t.vence_em === hoje ? "Hoje" : dataCurta(t.vence_em)}
                </span>
              )}
              {t.cliente && <span className="rounded-full bg-lavanda px-2 py-0.5 text-marca-escura">{t.cliente.nome}</span>}
              {t.conversa_id && t.cliente_id && (
                <Link
                  href={`/clientes/${t.cliente_id}?aba=atendimento&conversa=${t.conversa_id}`}
                  className="font-medium text-marca-escura hover:underline"
                >
                  Abrir conversa →
                </Link>
              )}
            </div>
          </div>
          <form action={excluirTarefa.bind(null, t.id)}>
            <button className="text-xs text-gray-400 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100" title="Excluir tarefa">
              Excluir
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
