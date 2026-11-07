"use client";

import { useActionState } from "react";
import { Icone } from "@/components/Icone";
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
      <button className="botao w-full py-3 text-base" disabled={pendente}>
        {pendente ? "Aguarde..." : botao}
        {!pendente && <Icone nome="seta" className="h-5 w-5" />}
      </button>
    </form>
  );
}
