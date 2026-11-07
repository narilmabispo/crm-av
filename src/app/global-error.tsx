"use client";

export default function ErroGeral({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 32 }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>Algo deu errado.</p>
        <pre style={{ whiteSpace: "pre-wrap", color: "#b91c1c", fontSize: 12 }}>
          {error.message || "Erro sem mensagem"}
          {error.digest ? `\ncódigo: ${error.digest}` : ""}
        </pre>
        <button onClick={reset}>Tentar de novo</button>
      </body>
    </html>
  );
}
