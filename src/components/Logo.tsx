import { MARCA } from "@/lib/marca";

// Cores sólidas (sem gradiente) para o logo aparecer mesmo repetido na página.
// Símbolo: balão roxo atrás, balão laranja na frente com reticências e dois "brilhos".
export function Simbolo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 56" className={className} aria-hidden="true">
      <path d="M16 8h10a14 14 0 0 1 0 28h-8l-9 7 2-8.5A14 14 0 0 1 16 8z" fill="#8b5cf6" />
      <path d="M34 17h9a13 13 0 0 1 0 26h-3l-6 7-1-7.2A13 13 0 0 1 34 17z" fill="#f97316" />
      <circle cx="31" cy="30" r="2.6" fill="#fff" />
      <circle cx="39" cy="30" r="2.6" fill="#fff" />
      <circle cx="47" cy="30" r="2.6" fill="#fff" />
      <path d="M50 11l3-7M55.5 14.5l6-4" stroke="#f97316" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ tamanho = "md" }: { tamanho?: "md" | "lg" }) {
  if (tamanho === "lg") {
    return (
      <div className="flex flex-col items-center">
        <Simbolo className="h-28 w-32" />
        <p className="titulo text-6xl font-bold tracking-tight">
          <span className="text-tinta">{MARCA.parte1}</span>
          <span className="text-laranja">{MARCA.parte2}</span>
        </p>
      </div>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <Simbolo className="h-9 w-10" />
      <span className="titulo text-2xl font-bold tracking-tight">
        <span className="text-tinta">{MARCA.parte1}</span>
        <span className="text-laranja">{MARCA.parte2}</span>
      </span>
    </span>
  );
}
