import { EmBreve } from "@/components/EmBreve";

export default function Relatorios() {
  return (
    <EmBreve
      titulo="Relatórios"
      icone="relatorios"
      texto="Aqui você vai ver como foram os atendimentos de cada cliente, para mostrar seu trabalho a eles."
      itens={["Conversas atendidas por dia e por cliente", "Tempo médio de resposta", "Resumo mensal para enviar ao cliente"]}
    />
  );
}
