import { Logo } from "@/components/Logo";
import { MARCA } from "@/lib/marca";

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#f6f0ff] via-creme to-[#f1e8ff] px-4 py-10">
      {/* Manchas decorativas de fundo */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-violet-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-32 h-96 w-96 rounded-full bg-violet-400/30 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 -bottom-20 h-64 w-64 rounded-full bg-orange-200/40 blur-3xl" />

      <div className="relative flex w-full max-w-md flex-col items-center gap-8">
        <div className="text-center">
          <Logo tamanho="lg" />
          <p className="mt-3 text-2xl font-semibold text-tinta">{MARCA.slogan}</p>
          <p className="mt-2 text-gray-600">{MARCA.frase}</p>
        </div>
        <div className="w-full rounded-3xl border border-white bg-white/90 p-8 shadow-xl shadow-violet-200/50 backdrop-blur">
          {children}
        </div>
      </div>
    </main>
  );
}
