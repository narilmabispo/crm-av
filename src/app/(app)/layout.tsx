import Link from "next/link";
import { Icone } from "@/components/Icone";
import { MenuLateral } from "@/components/MenuLateral";
import { carregarConta } from "@/lib/conta";
import { iniciais } from "@/lib/whatsapps";
import { sair } from "../(auth)/actions";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const { supabase, user, nome, plano, totalClientes, limite } = await carregarConta();
  const { count: naoLidas } = await supabase
    .from("conversas")
    .select("id", { count: "exact", head: true })
    .gt("nao_lidas", 0);

  return (
    <div className="min-h-screen">
      <MenuLateral naoLidas={naoLidas ?? 0} plano={plano?.nome ?? "Sem plano"} usados={totalClientes} limite={limite} />

      <div className="lg:pl-72">
        <header className="flex items-center justify-end gap-3 px-4 pt-4 sm:px-8 sm:pt-6">
          <Link
            href="/atendimentos"
            className="relative rounded-full p-2 text-tinta hover:bg-white"
            aria-label="Conversas não lidas"
          >
            <Icone nome="sino" className="h-6 w-6" />
            {(naoLidas ?? 0) > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-laranja ring-2 ring-background" />
            )}
          </Link>
          <details className="relative">
            <summary className="flex cursor-pointer items-center gap-1">
              <span className="titulo flex h-11 w-11 items-center justify-center rounded-full bg-marca font-semibold text-white">
                {iniciais(nome)}
              </span>
              <Icone nome="abaixo" className="h-4 w-4 text-gray-500" />
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-60 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg">
              <div className="px-3 py-2">
                <p className="truncate font-medium">{nome}</p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>
              <Link href="/perfil" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-lavanda">
                <Icone nome="usuario" className="h-4 w-4" /> Meu perfil
              </Link>
              <Link href="/perfil#financeiro" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-lavanda">
                <Icone nome="coroa" className="h-4 w-4" /> Plano e pagamento
              </Link>
              <Link href="/conta" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-lavanda">
                <Icone nome="configuracoes" className="h-4 w-4" /> Configurações
              </Link>
              <form action={sair}>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  <Icone nome="sair" className="h-4 w-4" /> Sair
                </button>
              </form>
            </div>
          </details>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-2 pb-10 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
