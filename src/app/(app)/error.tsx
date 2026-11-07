"use client";

import { useEffect } from "react";

// Mostra o erro na própria página (em vez da tela branca) para facilitar o suporte.
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="rounded-2xl border border-red-200 bg-white p-8">
      <p className="text-lg font-medium">Algo deu errado nesta tela.</p>
      <p className="mt-2 text-sm text-gray-600">Tente de novo. Se continuar, mande um print desta mensagem para o suporte.</p>
      <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-red-700">
        {error.message || "Erro sem mensagem"}
        {error.digest ? `\ncódigo: ${error.digest}` : ""}
      </pre>
      <button onClick={reset} className="botao mt-4">
        Tentar de novo
      </button>
    </div>
  );
}
