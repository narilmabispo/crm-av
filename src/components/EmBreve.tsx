import { Icone, type NomeIcone } from "./Icone";

// Página provisória das abas que ainda vamos construir.
export function EmBreve({ titulo, icone, texto, itens }: { titulo: string; icone: NomeIcone; texto: string; itens: string[] }) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-tinta">{titulo}</h1>
      <div className="cartao flex flex-col items-center p-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-lavanda text-marca">
          <Icone nome={icone} className="h-8 w-8" />
        </span>
        <span className="mt-4 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-laranja-escura">Em breve</span>
        <p className="mt-3 max-w-md text-gray-600">{texto}</p>
        <ul className="mt-6 space-y-2 text-left text-sm text-gray-700">
          {itens.map((i) => (
            <li key={i} className="flex items-start gap-2">
              <Icone nome="check" className="mt-0.5 h-4 w-4 shrink-0 text-marca" />
              {i}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
