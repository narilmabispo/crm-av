"use client";

import { useState } from "react";
import { Icone, type NomeIcone } from "@/components/Icone";

type Props = {
  icone: NomeIcone;
  name: string;
  type?: string;
  placeholder: string;
  required?: boolean;
};

// Campo com ícone à esquerda. Nos campos de senha, mostra o botão de olho para ver o que foi digitado.
export function Campo({ icone, name, type = "text", placeholder, required }: Props) {
  const [ver, setVer] = useState(false);
  const senha = type === "password";
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
        <Icone nome={icone} />
      </span>
      <input
        name={name}
        type={senha && ver ? "text" : type}
        placeholder={placeholder}
        required={required}
        className="campo py-3 pl-11 pr-11"
      />
      {senha && (
        <button
          type="button"
          onClick={() => setVer(!ver)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-marca"
          aria-label={ver ? "Esconder senha" : "Mostrar senha"}
        >
          <Icone nome={ver ? "olhoFechado" : "olho"} />
        </button>
      )}
    </div>
  );
}
