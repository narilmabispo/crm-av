// Cores das etiquetas: o nome fica salvo no banco e a classe do Tailwind é escolhida aqui.
export const CORES_ETIQUETA = {
  roxo: { nome: "Roxo", chip: "bg-violet-100 text-violet-800", bolinha: "bg-violet-500" },
  azul: { nome: "Azul", chip: "bg-sky-100 text-sky-800", bolinha: "bg-sky-500" },
  verde: { nome: "Verde", chip: "bg-emerald-100 text-emerald-800", bolinha: "bg-emerald-500" },
  amarelo: { nome: "Amarelo", chip: "bg-amber-100 text-amber-900", bolinha: "bg-amber-400" },
  laranja: { nome: "Laranja", chip: "bg-orange-100 text-orange-800", bolinha: "bg-orange-500" },
  vermelho: { nome: "Vermelho", chip: "bg-red-100 text-red-800", bolinha: "bg-red-500" },
  rosa: { nome: "Rosa", chip: "bg-pink-100 text-pink-800", bolinha: "bg-pink-500" },
  cinza: { nome: "Cinza", chip: "bg-gray-100 text-gray-700", bolinha: "bg-gray-400" },
} as const;

export type CorEtiqueta = keyof typeof CORES_ETIQUETA;

export type Etiqueta = { id: string; nome: string; cor: string };

export function corDaEtiqueta(cor: string) {
  return CORES_ETIQUETA[cor as CorEtiqueta] ?? CORES_ETIQUETA.roxo;
}

export const ETIQUETAS_SUGERIDAS: { nome: string; cor: CorEtiqueta }[] = [
  { nome: "Novo contato", cor: "azul" },
  { nome: "Orçamento", cor: "amarelo" },
  { nome: "Agendado", cor: "roxo" },
  { nome: "Pago", cor: "verde" },
];
