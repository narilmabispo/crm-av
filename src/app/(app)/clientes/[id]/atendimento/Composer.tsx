"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { enviarArquivo, enviarFigurinha, enviarMensagem, listarFigurinhas } from "./actions";

type Props = { conversaId: string; aoEnviar: () => void };

// Sobe o arquivo para a pasta da assistente no Supabase e devolve o caminho.
async function subirArquivo(arquivo: Blob, nome: string, tipo: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Entre de novo.");
  const seguro = nome.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);
  const caminho = `${user.id}/enviadas/${crypto.randomUUID()}-${seguro}`;
  const { error } = await supabase.storage.from("midias").upload(caminho, arquivo, { contentType: tipo });
  if (error) throw new Error("Não foi possível subir o arquivo. " + error.message);
  return caminho;
}

export function Composer({ conversaId, aoEnviar }: Props) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [enviando, iniciar] = useTransition();
  const [figurinhas, setFigurinhas] = useState<string[] | null>(null);
  const [gravando, setGravando] = useState(false);
  const entradaArquivo = useRef<HTMLInputElement>(null);
  const gravador = useRef<MediaRecorder | null>(null);

  const executar = (rotulo: string, acao: () => Promise<{ erro?: string } | void>) =>
    iniciar(async () => {
      setErro(undefined);
      setStatus(rotulo);
      try {
        const r = await acao();
        if (r?.erro) setErro(r.erro);
        else aoEnviar();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível enviar.");
      } finally {
        setStatus(undefined);
      }
    });

  const enviarTexto = (e?: React.FormEvent) => {
    e?.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo) return;
    setTexto("");
    executar("Enviando...", async () => {
      const r = await enviarMensagem(conversaId, conteudo);
      if (r.erro) setTexto(conteudo);
      return r;
    });
  };

  const escolherArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    const legenda = texto.trim();
    setTexto("");
    executar("Enviando arquivo...", async () => {
      const tipo = arquivo.type || "application/octet-stream";
      const caminho = await subirArquivo(arquivo, arquivo.name, tipo);
      return enviarArquivo(conversaId, { caminho, mimetype: tipo, nome: arquivo.name, legenda });
    });
  };

  const alternarGravacao = async () => {
    if (gravador.current) {
      gravador.current.stop();
      return;
    }
    setErro(undefined);
    let fluxo: MediaStream;
    try {
      fluxo = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErro("Permita o uso do microfone no navegador para gravar áudio.");
      return;
    }
    const tipo = ["audio/ogg;codecs=opus", "audio/webm;codecs=opus", "audio/webm"].find((t) =>
      MediaRecorder.isTypeSupported(t),
    );
    const rec = new MediaRecorder(fluxo, tipo ? { mimeType: tipo } : undefined);
    const partes: Blob[] = [];
    rec.ondataavailable = (ev) => partes.push(ev.data);
    rec.onstop = () => {
      fluxo.getTracks().forEach((t) => t.stop());
      gravador.current = null;
      setGravando(false);
      const mime = (rec.mimeType || "audio/webm").split(";")[0];
      const audio = new Blob(partes, { type: mime });
      if (audio.size < 1000) return; // clique sem gravar nada
      executar("Enviando áudio...", async () => {
        const nome = `audio.${mime.includes("ogg") ? "ogg" : "webm"}`;
        const caminho = await subirArquivo(audio, nome, mime);
        return enviarArquivo(conversaId, { caminho, mimetype: mime, nome });
      });
    };
    rec.start();
    gravador.current = rec;
    setGravando(true);
  };

  const abrirFigurinhas = async () => {
    if (figurinhas) return setFigurinhas(null);
    setFigurinhas(await listarFigurinhas());
  };

  return (
    <div className="border-t border-gray-200">
      {figurinhas && (
        <div className="max-h-56 overflow-y-auto border-b border-gray-200 p-3">
          {figurinhas.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nenhuma figurinha ainda. As figurinhas que seus contatos mandarem aparecem aqui para você reaproveitar.
            </p>
          ) : (
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
              {figurinhas.map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setFigurinhas(null);
                    executar("Enviando figurinha...", () => enviarFigurinha(conversaId, id));
                  }}
                  className="rounded-md p-1 hover:bg-gray-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/midia/${id}`} alt="Figurinha" loading="lazy" className="h-16 w-16 object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <form onSubmit={enviarTexto} className="flex items-end gap-2 p-3">
        <button type="button" onClick={abrirFigurinhas} title="Figurinhas" className="botao-secundario px-3">
          🌟
        </button>
        <button
          type="button"
          onClick={() => entradaArquivo.current?.click()}
          title="Anexar foto, vídeo ou documento"
          className="botao-secundario px-3"
        >
          📎
        </button>
        <input ref={entradaArquivo} type="file" onChange={escolherArquivo} className="hidden" />
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviarTexto();
            }
          }}
          rows={1}
          placeholder={gravando ? "Gravando... clique em ⏹ para enviar" : "Digite uma mensagem"}
          disabled={gravando}
          className="campo resize-none"
        />
        {texto.trim() ? (
          <button className="botao" disabled={enviando}>
            Enviar
          </button>
        ) : (
          <button
            type="button"
            onClick={alternarGravacao}
            disabled={enviando}
            title={gravando ? "Parar e enviar" : "Gravar áudio"}
            className={gravando ? "botao bg-red-600 hover:bg-red-700" : "botao"}
          >
            {gravando ? "⏹" : "🎤"}
          </button>
        )}
      </form>
      {(status || erro) && (
        <p className={`px-3 pb-3 text-sm ${erro ? "text-red-600" : "text-gray-500"}`}>{erro ?? status}</p>
      )}
    </div>
  );
}
