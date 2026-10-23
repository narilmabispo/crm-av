"use client";

import { useActionState } from "react";
import type { Cliente } from "@/lib/conta";
import type { EstadoCliente } from "./actions";

type Props = {
  acao: (estado: EstadoCliente, form: FormData) => Promise<EstadoCliente>;
  cliente?: Cliente;
  botao: string;
};

export function FormCliente({ acao, cliente, botao }: Props) {
  const [estado, enviar, pendente] = useActionState(acao, {});
  return (
    <form action={enviar} className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Nome
        <input name="nome" defaultValue={cliente?.nome} required className="campo" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Profissão
        <input name="profissao" defaultValue={cliente?.profissao ?? ""} className="campo" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Cidade
        <input name="cidade" defaultValue={cliente?.cidade ?? ""} className="campo" />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Empresa
        <input name="empresa" defaultValue={cliente?.empresa ?? ""} className="campo" />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Observações de atendimento
        <textarea
          name="observacoes"
          rows={4}
          defaultValue={cliente?.observacoes ?? ""}
          placeholder="Horários, tom de voz, produtos, perguntas frequentes..."
          className="campo"
        />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="botao" disabled={pendente}>
          {pendente ? "Salvando..." : botao}
        </button>
        {estado.erro && <p className="text-sm text-red-600">{estado.erro}</p>}
        {estado.aviso && <p className="text-sm text-marca-escura">{estado.aviso}</p>}
      </div>
    </form>
  );
}
