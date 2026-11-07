import { BotaoNovoWhatsapp } from "@/components/BotaoNovoWhatsapp";
import { ListaWhatsapps } from "@/components/ListaWhatsapps";
import { carregarConta } from "@/lib/conta";
import { carregarWhatsapps } from "@/lib/whatsapps";

export default async function Conexoes() {
  const { supabase, podeAdicionar } = await carregarConta();
  const whatsapps = await carregarWhatsapps(supabase);
  const conectados = whatsapps.filter((w) => w.status === "conectado").length;
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tinta">Conexões (WhatsApps)</h1>
          <p className="text-gray-600">
            {conectados} de {whatsapps.length} WhatsApps conectados. Clique em um deles para conectar pelo QR Code.
          </p>
        </div>
        <BotaoNovoWhatsapp podeAdicionar={podeAdicionar} />
      </div>
      <ListaWhatsapps itens={whatsapps} />
    </>
  );
}
