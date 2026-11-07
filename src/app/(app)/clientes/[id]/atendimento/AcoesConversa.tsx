"use client";

import { useOptimistic, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { corDaEtiqueta, type Etiqueta } from "@/lib/etiquetas";
import { marcarEtiqueta } from "../../../etiquetas/actions";
import { FormTarefa } from "../../../tarefas/FormTarefa";

type Props = {
  clienteId: string;
  conversaId: string;
  nomeContato: string;
  etiquetas: Etiqueta[];
  marcadas: string[];
  hoje: string;
};

// Etiquetas da conversa e lembrete de retorno, no topo do chat.
export function AcoesConversa({ clienteId, conversaId, nomeContato, etiquetas, marcadas, hoje }: Props) {
  const router = useRouter();
  const [, iniciar] = useTransition();
  const [atuais, alterar] = useOptimistic(marcadas, (lista: string[], { id, marcar }: { id: string; marcar: boolean }) =>
    marcar ? [...lista, id] : lista.filter((x) => x !== id),
  );
  const lembrete = useRef<HTMLDetailsElement>(null);

  const alternar = (id: string) => {
    const marcar = !atuais.includes(id);
    iniciar(async () => {
      alterar({ id, marcar });
      await marcarEtiqueta(conversaId, id, marcar);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {etiquetas
        .filter((e) => atuais.includes(e.id))
        .map((e) => (
          <span key={e.id} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${corDaEtiqueta(e.cor).chip}`}>
            {e.nome}
          </span>
        ))}

      <details className="relative">
        <summary className="cursor-pointer rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-lavanda">
          Etiquetas
        </summary>
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg">
          {etiquetas.length === 0 ? (
            <p className="p-2 text-sm text-gray-600">
              Você ainda não tem etiquetas.{" "}
              <Link href="/etiquetas" className="font-medium text-marca-escura hover:underline">
                Criar etiquetas
              </Link>
            </p>
          ) : (
            <>
              {etiquetas.map((e) => (
                <label key={e.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-lavanda">
                  <input
                    type="checkbox"
                    checked={atuais.includes(e.id)}
                    onChange={() => alternar(e.id)}
                    className="h-4 w-4 accent-marca"
                  />
                  <span className={`h-2.5 w-2.5 rounded-full ${corDaEtiqueta(e.cor).bolinha}`} />
                  {e.nome}
                </label>
              ))}
              <Link href="/etiquetas" className="mt-1 block border-t border-gray-100 px-2 pt-2 text-xs text-marca-escura hover:underline">
                Gerenciar etiquetas
              </Link>
            </>
          )}
        </div>
      </details>

      <details ref={lembrete} className="relative">
        <summary className="cursor-pointer rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-lavanda">
          Lembrete
        </summary>
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
          <p className="mb-3 text-sm font-medium text-tinta">Lembrete de retorno</p>
          <FormTarefa
            clientes={[]}
            hoje={hoje}
            clienteId={clienteId}
            conversaId={conversaId}
            tituloInicial={`Retornar para ${nomeContato}`}
            compacto
            aoSalvar={() => setTimeout(() => lembrete.current?.removeAttribute("open"), 1200)}
          />
        </div>
      </details>
    </div>
  );
}
