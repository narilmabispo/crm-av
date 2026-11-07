"use client";

import { useActionState } from "react";
import { salvarPerfil } from "./actions";

export type DadosPerfil = {
  nome: string;
  telefone: string | null;
  cidade: string | null;
  documento: string | null;
  instagram: string | null;
};

export function FormPerfil({ dados, email }: { dados: DadosPerfil; email: string }) {
  const [estado, enviar, pendente] = useActionState(salvarPerfil, {});
  return (
    <form action={enviar} className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Nome
        <input name="nome" defaultValue={dados.nome} required className="campo" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        E-mail
        <input value={email} disabled className="campo bg-gray-50 text-gray-500" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        WhatsApp
        <input name="telefone" defaultValue={dados.telefone ?? ""} inputMode="tel" placeholder="(71) 9 8888-1122" className="campo" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Cidade
        <input name="cidade" defaultValue={dados.cidade ?? ""} className="campo" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        CPF ou CNPJ
        <input name="documento" defaultValue={dados.documento ?? ""} inputMode="numeric" className="campo" />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Instagram
        <input name="instagram" defaultValue={dados.instagram ? `@${dados.instagram}` : ""} placeholder="@seuperfil" className="campo" />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="botao" disabled={pendente}>
          {pendente ? "Salvando..." : "Salvar dados"}
        </button>
        {estado.erro && <p className="text-sm text-red-600">{estado.erro}</p>}
        {estado.aviso && <p className="text-sm text-marca-escura">{estado.aviso}</p>}
      </div>
    </form>
  );
}
