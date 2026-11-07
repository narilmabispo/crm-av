"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarTarefa } from "./actions";

type Props = {
  clientes: { id: string; nome: string }[];
  hoje: string;
  // Quando a tarefa nasce de uma conversa (lembrete de retorno).
  clienteId?: string;
  conversaId?: string;
  tituloInicial?: string;
  compacto?: boolean;
  aoSalvar?: () => void;
};

export function FormTarefa({ clientes, hoje, clienteId, conversaId, tituloInicial, compacto, aoSalvar }: Props) {
  const [estado, enviar, pendente] = useActionState(criarTarefa, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!estado.ok) return;
    form.current?.reset();
    aoSalvar?.();
    // aoSalvar muda a cada render; só queremos reagir a um novo salvamento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.ok]);

  return (
    <form ref={form} action={enviar} className={compacto ? "space-y-3" : "cartao space-y-4 p-5"}>
      {!compacto && <h2 className="font-semibold text-tinta">Nova tarefa</h2>}
      <input
        name="titulo"
        required
        maxLength={200}
        defaultValue={tituloInicial}
        placeholder="Ex.: Retornar orçamento para a Maria"
        className="campo"
      />
      {conversaId ? (
        <>
          <input type="hidden" name="conversa_id" value={conversaId} />
          <input type="hidden" name="cliente_id" value={clienteId} />
        </>
      ) : (
        <label className="flex flex-col gap-1 text-sm">
          Cliente
          <select name="cliente_id" defaultValue="" className="campo">
            <option value="">Nenhum (tarefa minha)</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm">
        Para quando
        <input type="date" name="vence_em" defaultValue={hoje} className="campo" />
      </label>
      <div className="flex items-center gap-3">
        <button className="botao" disabled={pendente}>
          {pendente ? "Salvando..." : conversaId ? "Criar lembrete" : "Adicionar tarefa"}
        </button>
        {estado.erro && <p className="text-sm text-red-600">{estado.erro}</p>}
        {compacto && estado.ok && !pendente && <p className="text-sm text-marca-escura">Lembrete criado.</p>}
      </div>
    </form>
  );
}
