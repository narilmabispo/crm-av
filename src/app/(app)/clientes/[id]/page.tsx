import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ListaWhatsapps";
import { carregarConta, type Cliente } from "@/lib/conta";
import { atualizarCliente, excluirCliente } from "../actions";
import { FormCliente } from "../FormCliente";
import { Atendimento } from "./atendimento/Atendimento";

// A importação do histórico pode levar alguns segundos.
export const maxDuration = 60;

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ aba?: string; conversa?: string }> };

export default async function PerfilCliente({ params, searchParams }: Props) {
  const { id } = await params;
  const { aba = "atendimento", conversa } = await searchParams;
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
      <Link href="/clientes" className="text-sm text-gray-500 hover:text-marca">
        ← Clientes
      </Link>
      <div className="mt-3 mb-6 flex items-center gap-4">
        <Avatar nome={cliente.nome} tamanho="h-14 w-14" />
        <div>
          <h1 className="text-2xl font-bold text-tinta">{cliente.nome}</h1>
          <p className="text-sm text-gray-600">
            {[cliente.profissao, cliente.empresa, cliente.cidade].filter(Boolean).join(" · ")}
          </p>
        </div>
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
          <div className="cartao p-6">
            <FormCliente acao={atualizarCliente.bind(null, id)} cliente={cliente} botao="Salvar perfil" />
          </div>
          <form action={excluirCliente.bind(null, id)}>
            <button className="text-sm text-red-600 hover:underline">Excluir cliente</button>
          </form>
        </div>
      ) : (
        <Atendimento clienteId={id} nomeCliente={cliente.nome} conversaId={conversa} />
      )}
    </>
  );
}
