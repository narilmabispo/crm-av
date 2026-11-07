"use client";

import { useState } from "react";

// Texto pronto do resumo do mês, com botão para copiar e colar no WhatsApp do cliente.
export function ResumoParaCliente({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };
  return (
    <div className="cartao p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-tinta">Resumo para enviar ao cliente</h2>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="botao-secundario py-1.5 print:hidden">
            Imprimir / PDF
          </button>
          <button onClick={copiar} className="botao py-1.5 print:hidden">
            {copiado ? "Copiado!" : "Copiar texto"}
          </button>
        </div>
      </div>
      <pre className="rounded-xl bg-lavanda/60 p-4 font-sans text-sm whitespace-pre-wrap text-gray-800">{texto}</pre>
    </div>
  );
}
