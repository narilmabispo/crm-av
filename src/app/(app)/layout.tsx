import Link from "next/link";
import { carregarConta } from "@/lib/conta";
import { sair } from "../(auth)/actions";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const { nome, plano, totalClientes, limite } = await carregarConta();
  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/painel" className="text-lg font-semibold text-marca-escura">
            CRM AV
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-gray-600 sm:inline">
              {plano?.nome ?? "Sem plano"} · {totalClientes} de {limite} clientes
            </span>
            <Link href="/conta" className="text-gray-700 hover:text-marca">
              {nome}
            </Link>
            <form action={sair}>
              <button className="text-gray-500 hover:text-red-600">Sair</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
