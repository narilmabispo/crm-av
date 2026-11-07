import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MARCA } from "@/lib/marca";

export default function Inicio() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#f6f0ff] via-creme to-[#f1e8ff] px-6 text-center">
      <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-violet-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-32 h-96 w-96 rounded-full bg-orange-200/50 blur-3xl" />
      <div className="relative max-w-2xl">
        <Logo tamanho="lg" />
        <h1 className="mt-6 text-3xl font-bold text-tinta sm:text-4xl">{MARCA.slogan}</h1>
        <p className="mt-4 text-lg text-gray-600">
          Organize o perfil de cada cliente e atenda o WhatsApp da empresa dele sem trocar de celular ou de aba.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/cadastro" className="botao px-6 py-3 text-base">
            Criar minha conta gratuita
          </Link>
          <Link href="/login" className="botao-laranja px-6 py-3 text-base">
            Entrar
          </Link>
        </div>
      </div>
    </main>
  );
}
