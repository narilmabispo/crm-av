"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarEtiqueta } from "./actions";
import { SeletorCor } from "./SeletorCor";

export function FormNovaEtiqueta() {
  const [estado, enviar, pendente] = useActionState(criarEtiqueta, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.ok) form.current?.reset();
  }, [estado.ok]);

  return (
    <form ref={form} action={enviar} className="cartao space-y-4 p-5">
      <h2 className="font-semibold text-tinta">Nova etiqueta</h2>
      <input name="nome" required maxLength={40} placeholder="Ex.: Aguardando pagamento" className="campo" />
      <SeletorCor />
      <div className="flex items-center gap-3">
        <button className="botao" disabled={pendente}>
          {pendente ? "Criando..." : "Criar etiqueta"}
        </button>
        {estado.erro && <p className="text-sm text-red-600">{estado.erro}</p>}
      </div>
    </form>
  );
}
