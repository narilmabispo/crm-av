import { EmBreve } from "@/components/EmBreve";

export default function Tarefas() {
  return (
    <EmBreve
      titulo="Tarefas"
      icone="tarefas"
      texto="Aqui você vai anotar o que precisa fazer por cliente e ver as tarefas do dia no Início."
      itens={["Lembretes de retorno para um contato", "Tarefas do dia e atrasadas", "Marcar como feita com um clique"]}
    />
  );
}
