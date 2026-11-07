import Link from "next/link";
import { BotaoNovoWhatsapp } from "@/components/BotaoNovoWhatsapp";
import { Icone, type NomeIcone } from "@/components/Icone";
import { ListaWhatsapps } from "@/components/ListaWhatsapps";
import { carregarConta } from "@/lib/conta";
import { MARCA } from "@/lib/marca";
import { carregarWhatsapps, iniciais } from "@/lib/whatsapps";

function Metrica({ href, icone, valor, rotulo, cor }: { href: string; icone: NomeIcone; valor: number; rotulo: string; cor: string }) {
  return (
    <Link href={href} className={`rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-md ${cor}`}>
      <Icone nome={icone} className="h-8 w-8" />
      <p className="titulo mt-3 text-3xl font-bold text-tinta">{valor}</p>
      <p className="text-sm text-gray-700">{rotulo}</p>
    </Link>
  );
}

export default async function Painel() {
  const { supabase, nome, podeAdicionar, totalClientes } = await carregarConta();
  const whatsapps = await carregarWhatsapps(supabase);
  const conectados = whatsapps.filter((w) => w.status === "conectado").length;
  const naoLidas = whatsapps.reduce((soma, w) => soma + w.naoLidas, 0);
  const primeiroNome = nome.includes("@") ? "" : nome.split(" ")[0];

  return (
    <>
      <div className="mb-8 flex items-center gap-4">
        <span className="titulo flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lilas to-marca text-xl font-bold text-white shadow-md sm:h-20 sm:w-20 sm:text-2xl">
          {iniciais(nome)}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-tinta sm:text-3xl">
            Olá{primeiroNome ? `, ${primeiroNome}` : ""}! <span aria-hidden="true">👋</span>
          </h1>
          <p className="text-gray-600">Bem-vinda ao seu {MARCA.nome}.</p>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metrica href="/conexoes" icone="whatsapp" valor={conectados} rotulo="WhatsApps conectados" cor="bg-lavanda text-marca" />
        <Metrica href="/atendimentos" icone="atendimentos" valor={naoLidas} rotulo="Conversas não lidas" cor="bg-orange-50 text-laranja" />
        <Metrica href="/clientes" icone="clientes" valor={totalClientes} rotulo="Clientes ativos" cor="bg-violet-50 text-marca-escura" />
        <Metrica href="/tarefas" icone="check" valor={0} rotulo="Tarefas do dia" cor="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold whitespace-nowrap text-tinta">Seus WhatsApps</h2>
        <BotaoNovoWhatsapp podeAdicionar={podeAdicionar} />
      </div>
      <ListaWhatsapps itens={whatsapps} />
    </>
  );
}
