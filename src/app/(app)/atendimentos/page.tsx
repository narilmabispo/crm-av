import { ListaWhatsapps } from "@/components/ListaWhatsapps";
import { carregarConta } from "@/lib/conta";
import { carregarWhatsapps } from "@/lib/whatsapps";

export default async function Atendimentos() {
  const { supabase } = await carregarConta();
  const whatsapps = await carregarWhatsapps(supabase);
  // Quem tem mensagens não lidas aparece primeiro.
  whatsapps.sort((a, b) => b.naoLidas - a.naoLidas);
  return (
    <>
      <h1 className="text-2xl font-bold text-tinta">Atendimentos</h1>
      <p className="mb-6 text-gray-600">Escolha o WhatsApp do cliente para abrir as conversas.</p>
      <ListaWhatsapps itens={whatsapps} />
    </>
  );
}
