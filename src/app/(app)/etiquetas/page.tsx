import { EmBreve } from "@/components/EmBreve";

export default function Etiquetas() {
  return (
    <EmBreve
      titulo="Etiquetas"
      icone="etiquetas"
      texto="Aqui você vai criar etiquetas coloridas para organizar as conversas de cada cliente."
      itens={["Etiquetas como Novo contato, Orçamento, Agendado, Pago", "Filtrar conversas por etiqueta", "Cores para achar tudo rápido"]}
    />
  );
}
