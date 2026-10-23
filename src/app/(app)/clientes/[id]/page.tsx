import Link from "next/link";
import { notFound } from "next/navigation";
import { carregarConta, type Cliente } from "@/lib/conta";
import { atualizarCliente, excluirCliente } from "../actions";
import { FormCliente } from "../FormCliente";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ aba?: string }> };

export default async function PerfilCliente({ params, searchParams }: Props) {
  const { id } = await params;
  const { aba = "atendimento" } = await searchParams;
  const { supabase } = await carregarConta();

  const { data } = await supabase
    .from("clientes")
    .select("id, nome, profissao, cidade, empresa, observacoes")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const cliente = data as Cliente;

  const abas = [
    { id: "atendimento", nome: "Atendimento" },
    { id: "perfil", nome: "Perfil" },
  ];

  return (
    <>
      <Link href="/painel" className="text-sm text-gray-500 hover:text-marca">
        ← Meus clientes
      </Link>
      <div className="mt-2 mb-6">
        <h1 className="text-2xl font-semibold">{cliente.nome}</h1>
        <p className="text-sm text-gray-600">
          {[cliente.profissao, cliente.empresa, cliente.cidade].filter(Boolean).join(" · ")}
        </p>
      </div>

      <nav className="mb-6 flex gap-1 border-b border-gray-200">
        {abas.map((a) => (
          <Link
            key={a.id}
            href={`/clientes/${id}?aba=${a.id}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              aba === a.id ? "border-marca text-marca-escura" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {a.nome}
          </Link>
        ))}
      </nav>

      {aba === "perfil" ? (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <FormCliente acao={atualizarCliente.bind(null, id)} cliente={cliente} botao="Salvar perfil" />
          </div>
          <form action={excluirCliente.bind(null, id)}>
            <button className="text-sm text-red-600 hover:underline">Excluir cliente</button>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-lg font-medium">WhatsApp ainda não conectado</p>
          <p className="mt-2 text-sm text-gray-600">
            Em breve: conecte o WhatsApp da empresa de {cliente.nome} escaneando um QR Code e atenda as conversas por
            aqui.
          </p>
          <button className="botao mt-6" disabled>
            Conectar WhatsApp
          </button>
        </div>
      )}
    </>
  );
}
