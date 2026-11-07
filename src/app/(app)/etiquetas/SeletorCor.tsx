import { CORES_ETIQUETA } from "@/lib/etiquetas";

// Bolinhas de cor (rádio) para escolher a cor da etiqueta.
export function SeletorCor({ atual = "roxo", nomeCampo = "cor" }: { atual?: string; nomeCampo?: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cor">
      {Object.entries(CORES_ETIQUETA).map(([id, c]) => (
        <label key={id} title={c.nome} className="cursor-pointer">
          <input type="radio" name={nomeCampo} value={id} defaultChecked={id === atual} className="peer sr-only" />
          <span
            className={`block h-7 w-7 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-tinta peer-focus-visible:ring-2 peer-focus-visible:ring-marca ${c.bolinha}`}
          />
          <span className="sr-only">{c.nome}</span>
        </label>
      ))}
    </div>
  );
}
