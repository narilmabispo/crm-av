import Link from "next/link";
import { BotaoNovoWhatsapp } from "@/components/BotaoNovoWhatsapp";
import { Avatar, SeloStatus } from "@/components/ListaWhatsapps";
import { carregarConta } from "@/lib/conta";
import { carregarWhatsapps } from "@/lib/whatsapps";

export default async function Clientes() {
  const { supabase, podeAdicionar, totalClientes, limite } = await carregarConta();
  const clientes = await carregarWhatsapps(supabase);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tinta">Clientes</h1>
          <p className="text-gray-600">
            {totalClientes} de {limite} clientes do seu plano
          </p>
        </div>
        <BotaoNovoWhatsapp podeAdicionar={podeAdicionar} />
      </div>

      {clientes.length === 0 ? (
        <div className="cartao border-dashed p-10 text-center text-gray-600">Você ainda não cadastrou clientes.</div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientes.map((c) => (
            <li key={c.id}>
              <Link href={`/clientes/${c.id}?aba=perfil`} className="cartao block h-full p-5 transition hover:border-lilas hover:shadow-md">
                <div className="flex items-center gap-3">
                  <Avatar nome={c.nome} conectado={c.status === "conectado"} />
                  <div className="min-w-0">
                    <p className="titulo truncate font-semibold text-tinta">{c.nome}</p>
                    <p className="truncate text-sm text-gray-500">{c.detalhe || "Sem profissão cadastrada"}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <SeloStatus status={c.status} />
                  <span className="text-sm font-medium text-marca-escura">Ver perfil →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
