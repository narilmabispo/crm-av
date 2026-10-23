import Link from "next/link";
import { carregarConta, type Cliente } from "@/lib/conta";

export default async function Painel() {
  const { supabase, podeAdicionar, totalClientes, limite } = await carregarConta();
  const { data } = await supabase
    .from("clientes")
    .select("id, nome, profissao, cidade, empresa, observacoes")
    .order("criado_em");
  const clientes = (data ?? []) as Cliente[];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Meus clientes</h1>
          <p className="text-sm text-gray-600">
            {totalClientes} de {limite} clientes do seu plano
          </p>
        </div>
        {podeAdicionar ? (
          <Link href="/clientes/novo" className="botao">
            Novo cliente
          </Link>
        ) : (
          <Link href="/conta" className="botao-secundario">
            Aumentar plano
          </Link>
        )}
      </div>

      {clientes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
          Você ainda não cadastrou clientes. Comece pelo botão Novo cliente.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientes.map((c) => (
            <li key={c.id}>
              <Link
                href={`/clientes/${c.id}`}
                className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-marca"
              >
                <p className="font-semibold">{c.nome}</p>
                <p className="text-sm text-gray-600">{[c.profissao, c.empresa].filter(Boolean).join(" · ")}</p>
                <p className="mt-1 text-sm text-gray-500">{c.cidade}</p>
                <p className="mt-4 text-sm font-medium text-marca">Abrir atendimento →</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
