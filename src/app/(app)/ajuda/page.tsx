import { EmBreve } from "@/components/EmBreve";

export default function Ajuda() {
  return (
    <EmBreve
      titulo="Ajuda e Suporte"
      icone="ajuda"
      texto="Aqui vão ficar os tutoriais e o contato com o suporte."
      itens={["Como conectar o WhatsApp de um cliente", "Perguntas frequentes", "Falar com o suporte"]}
    />
  );
}
