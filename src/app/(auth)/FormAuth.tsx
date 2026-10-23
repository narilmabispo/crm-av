"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./actions";

type Props = {
  acao: (estado: EstadoForm, form: FormData) => Promise<EstadoForm>;
  botao: string;
  children: React.ReactNode;
};

export function FormAuth({ acao, botao, children }: Props) {
  const [estado, enviar, pendente] = useActionState(acao, {});
  return (
    <form action={enviar} className="flex flex-col gap-4">
      {children}
      {estado.erro && <p className="text-sm text-red-600">{estado.erro}</p>}
      {estado.aviso && <p className="text-sm text-marca-escura">{estado.aviso}</p>}
      <button className="botao" disabled={pendente}>
        {pendente ? "Aguarde..." : botao}
      </button>
    </form>
  );
}
