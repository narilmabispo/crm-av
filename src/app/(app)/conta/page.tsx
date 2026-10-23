import { carregarConta } from "@/lib/conta";

const STATUS: Record<string, string> = {
  teste: "Período de teste",
  ativa: "Ativa",
  atrasada: "Pagamento atrasado",
  cancelada: "Cancelada",
};

export default async function Conta() {
  const { supabase, user, nome, plano, status, totalClientes, limite } = await carregarConta();
  const { data: planos } = await supabase
    .from("planos")
    .select("id, nome, limite_clientes, preco_centavos")
    .order("limite_clientes");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Minha conta</h1>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 text-sm">
        <p className="font-medium">{nome}</p>
        <p className="text-gray-600">{user.email}</p>
      </section>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 text-sm">
        <h2 className="mb-2 font-semibold">Assinatura</h2>
        <p>
          {plano?.nome ?? "Sem plano"} · {STATUS[status] ?? status} · {totalClientes} de {limite} clientes
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {(planos ?? []).map((p) => (
            <li
              key={p.id}
              className={`rounded-xl border p-4 ${p.id === plano?.id ? "border-marca bg-marca/5" : "border-gray-200"}`}
            >
              <p className="font-medium">{p.nome}</p>
              <p className="text-gray-600">Até {p.limite_clientes} clientes</p>
              <p className="mt-1 text-gray-600">
                {p.preco_centavos > 0
                  ? (p.preco_centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + "/mês"
                  : "Preço a definir"}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-gray-500">A troca de plano e o pagamento entram na etapa de cobrança.</p>
      </section>
    </div>
  );
}
