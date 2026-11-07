"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icone, type NomeIcone } from "./Icone";
import { Logo } from "./Logo";

const ITENS: { href: string; nome: string; icone: NomeIcone; contador?: boolean }[] = [
  { href: "/painel", nome: "Início", icone: "inicio" },
  { href: "/atendimentos", nome: "Atendimentos", icone: "atendimentos", contador: true },
  { href: "/clientes", nome: "Clientes", icone: "clientes" },
  { href: "/conexoes", nome: "Conexões (WhatsApps)", icone: "whatsapp" },
  { href: "/etiquetas", nome: "Etiquetas", icone: "etiquetas" },
  { href: "/tarefas", nome: "Tarefas", icone: "tarefas" },
  { href: "/relatorios", nome: "Relatórios", icone: "relatorios" },
  { href: "/conta", nome: "Configurações", icone: "configuracoes" },
];

type Props = {
  naoLidas: number;
  plano: string;
  usados: number;
  limite: number;
};

export function MenuLateral({ naoLidas, plano, usados, limite }: Props) {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  useEffect(() => setAberto(false), [caminho]);

  const ativo = (href: string) => caminho === href || caminho.startsWith(href + "/");
  const porcentagem = limite > 0 ? Math.min(100, Math.round((usados / limite) * 100)) : 0;

  return (
    <>
      {/* Barra do topo no celular */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-violet-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/painel">
          <Logo />
        </Link>
        <button onClick={() => setAberto(true)} className="rounded-lg p-2 text-tinta hover:bg-lavanda" aria-label="Abrir menu">
          <Icone nome="menu" className="h-6 w-6" />
        </button>
      </div>

      {aberto && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setAberto(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-violet-100 bg-[#fbf9ff] px-4 py-6 transition-transform lg:translate-x-0 ${
          aberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <Link href="/painel">
            <Logo />
          </Link>
          <button onClick={() => setAberto(false)} className="rounded-lg p-1 text-gray-500 lg:hidden" aria-label="Fechar menu">
            <Icone nome="fechar" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {ITENS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors ${
                ativo(item.href) ? "bg-lavanda font-semibold text-marca-escura" : "text-gray-700 hover:bg-lavanda/60"
              }`}
            >
              <Icone nome={item.icone} />
              <span className="flex-1">{item.nome}</span>
              {item.contador && naoLidas > 0 && (
                <span className="rounded-full bg-marca px-2 py-0.5 text-xs font-semibold text-white">{naoLidas}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="mt-4 rounded-2xl border border-orange-100 bg-creme p-4">
          <Icone nome="coroa" className="h-6 w-6 text-laranja" />
          <p className="titulo mt-1 font-semibold text-tinta">{plano}</p>
          <p className="text-sm text-gray-600">
            {usados} de {limite} clientes
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-100">
            <div className="h-full rounded-full bg-laranja" style={{ width: `${porcentagem}%` }} />
          </div>
          <Link href="/perfil#financeiro" className="mt-3 inline-block text-sm font-medium text-marca-escura hover:underline">
            Gerenciar plano
          </Link>
        </div>

        <Link
          href="/ajuda"
          className={`mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] ${
            ativo("/ajuda") ? "bg-lavanda font-semibold text-marca-escura" : "text-gray-700 hover:bg-lavanda/60"
          }`}
        >
          <Icone nome="ajuda" />
          Ajuda e Suporte
        </Link>
      </aside>
    </>
  );
}
