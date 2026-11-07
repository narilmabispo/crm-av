import Link from "next/link";
import { Icone } from "@/components/Icone";
import { carregarConta } from "@/lib/conta";

export default async function Conta() {
  const { user, nome, plano, totalClientes, limite } = await carregarConta();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-tinta">Configurações</h1>
      <section className="cartao flex flex-wrap items-center justify-between gap-3 p-6 text-sm">
        <div>
          <p className="font-medium">{nome}</p>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <Link href="/perfil" className="botao-secundario">
          <Icone nome="usuario" className="h-4 w-4" /> Editar meu perfil
        </Link>
      </section>
      <section className="cartao flex flex-wrap items-center justify-between gap-3 p-6 text-sm">
        <div>
          <h2 className="font-semibold text-tinta">Assinatura</h2>
          <p className="text-gray-600">
            {plano?.nome ?? "Sem plano"} · {totalClientes} de {limite} clientes
          </p>
        </div>
        <Link href="/perfil#financeiro" className="botao-secundario">
          <Icone nome="coroa" className="h-4 w-4" /> Ver plano e pagamento
        </Link>
      </section>
      <section className="cartao flex flex-wrap items-center justify-between gap-3 p-6 text-sm">
        <div>
          <h2 className="font-semibold text-tinta">Etiquetas</h2>
          <p className="text-gray-600">Crie, renomeie e troque a cor das etiquetas das conversas.</p>
        </div>
        <Link href="/etiquetas" className="botao-secundario">
          <Icone nome="etiquetas" className="h-4 w-4" /> Gerenciar etiquetas
        </Link>
      </section>
    </div>
  );
}
