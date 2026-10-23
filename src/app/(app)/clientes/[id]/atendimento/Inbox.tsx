"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { desconectarWhatsapp, enviarMensagem, marcarComoLida } from "./actions";

export type Conversa = {
  id: string;
  jid: string;
  nome: string | null;
  ultima_mensagem: string | null;
  ultima_em: string | null;
  nao_lidas: number;
};

export type Mensagem = { id: string; de_mim: boolean; texto: string | null; enviada_em: string };

type Props = {
  clienteId: string;
  numero: string | null;
  conversas: Conversa[];
  selecionada: Conversa | null;
  mensagens: Mensagem[];
};

const hora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";

const titulo = (c: Conversa) => c.nome || "+" + c.jid.split("@")[0];

export function Inbox({ clienteId, numero, conversas: iniciais, selecionada, mensagens: msgsIniciais }: Props) {
  const [conversas, setConversas] = useState(iniciais);
  const [mensagens, setMensagens] = useState(msgsIniciais);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string>();
  const [enviando, iniciar] = useTransition();
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => setConversas(iniciais), [iniciais]);
  useEffect(() => setMensagens(msgsIniciais), [msgsIniciais]);
  useEffect(() => fim.current?.scrollIntoView(), [mensagens]);

  useEffect(() => {
    if (selecionada) marcarComoLida(selecionada.id);
  }, [selecionada]);

  // Atualiza a lista de conversas e o chat aberto em tempo real.
  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`atendimento-${clienteId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversas", filter: `cliente_id=eq.${clienteId}` },
        ({ new: nova }) => {
          const c = nova as Conversa;
          if (!c?.id) return;
          setConversas((atuais) =>
            [c, ...atuais.filter((x) => x.id !== c.id)].sort((a, b) =>
              (b.ultima_em ?? "").localeCompare(a.ultima_em ?? ""),
            ),
          );
        },
      );
    if (selecionada) {
      canal.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens", filter: `conversa_id=eq.${selecionada.id}` },
        ({ new: nova }) => {
          const m = nova as Mensagem;
          setMensagens((atuais) => (atuais.some((x) => x.id === m.id) ? atuais : [...atuais, m]));
          if (!m.de_mim) marcarComoLida(selecionada.id);
        },
      );
    }
    canal.subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [clienteId, selecionada]);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selecionada || !texto.trim()) return;
    const conteudo = texto;
    setTexto("");
    iniciar(async () => {
      const r = await enviarMensagem(selecionada.id, conteudo);
      setErro(r.erro);
      if (r.erro) setTexto(conteudo);
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 text-sm">
        <span className="text-marca-escura">● Conectado{numero ? ` · +${numero}` : ""}</span>
        <button
          onClick={() => confirm("Desconectar o WhatsApp deste cliente?") && desconectarWhatsapp(clienteId)}
          className="text-gray-500 hover:text-red-600"
        >
          Desconectar
        </button>
      </div>
      <div className="grid h-[70vh] grid-cols-1 md:grid-cols-[300px_1fr]">
        <ul className={`overflow-y-auto border-r border-gray-200 ${selecionada ? "hidden md:block" : ""}`}>
          {conversas.length === 0 && (
            <li className="p-6 text-sm text-gray-500">As conversas aparecem aqui quando alguém mandar mensagem.</li>
          )}
          {conversas.map((c) => (
            <li key={c.id}>
              <Link
                href={`/clientes/${clienteId}?aba=atendimento&conversa=${c.id}`}
                className={`flex gap-3 border-b border-gray-100 px-4 py-3 hover:bg-gray-50 ${
                  c.id === selecionada?.id ? "bg-marca/5" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="truncate font-medium">{titulo(c)}</p>
                    <span className="shrink-0 text-xs text-gray-400">{hora(c.ultima_em)}</span>
                  </div>
                  <p className="truncate text-sm text-gray-500">{c.ultima_mensagem}</p>
                </div>
                {c.nao_lidas > 0 && c.id !== selecionada?.id && (
                  <span className="self-center rounded-full bg-marca px-2 text-xs text-white">{c.nao_lidas}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {selecionada ? (
          <div className="flex min-h-0 flex-col">
            <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
              <Link href={`/clientes/${clienteId}?aba=atendimento`} className="text-gray-500 md:hidden">
                ←
              </Link>
              <p className="font-medium">{titulo(selecionada)}</p>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto bg-[#efeae2] p-4">
              {mensagens.map((m) => (
                <div key={m.id} className={`flex ${m.de_mim ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                      m.de_mim ? "bg-[#d9fdd3]" : "bg-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                    <p className="mt-1 text-right text-[10px] text-gray-500">{hora(m.enviada_em)}</p>
                  </div>
                </div>
              ))}
              <div ref={fim} />
            </div>
            <form onSubmit={enviar} className="flex gap-2 border-t border-gray-200 p-3">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) enviar(e);
                }}
                rows={1}
                placeholder="Digite uma mensagem"
                className="campo resize-none"
              />
              <button className="botao" disabled={enviando}>
                Enviar
              </button>
            </form>
            {erro && <p className="px-3 pb-3 text-sm text-red-600">{erro}</p>}
          </div>
        ) : (
          <div className="hidden items-center justify-center text-sm text-gray-500 md:flex">
            Escolha uma conversa para responder.
          </div>
        )}
      </div>
    </div>
  );
}
