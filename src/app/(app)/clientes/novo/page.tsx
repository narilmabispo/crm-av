import Link from "next/link";
import { carregarConta } from "@/lib/conta";
import { criarCliente } from "../actions";
import { FormCliente } from "../FormCliente";

export default async function NovoCliente() {
  const { podeAdicionar, limite } = await carregarConta();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-tinta">Novo cliente</h1>
      <p className="mb-6 text-gray-600">Cadastre o cliente. Depois é só conectar o WhatsApp dele pelo QR Code.</p>
      {podeAdicionar ? (
        <div className="cartao p-6">
          <FormCliente acao={criarCliente} botao="Salvar cliente" />
        </div>
      ) : (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm">
          Seu plano permite até {limite} clientes.{" "}
          <Link href="/conta" className="font-medium text-marca">
            Troque de plano
          </Link>{" "}
          para adicionar mais.
        </p>
      )}
    </div>
  );
}
