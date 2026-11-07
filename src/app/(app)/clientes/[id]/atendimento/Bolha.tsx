import { PREVIA } from "@/lib/mensagem-whatsapp";
import type { Mensagem } from "./Inbox";

const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

// Conteúdo de uma mensagem do chat: texto, foto, figurinha, áudio, vídeo ou documento.
function Conteudo({ m }: { m: Mensagem }) {
  const src = `/api/midia/${m.id}`;
  switch (m.tipo) {
    case "imagem":
      return (
        <a href={src} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Foto" loading="lazy" className="max-h-72 max-w-full rounded-md bg-black/5" />
        </a>
      );
    case "figurinha":
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt="Figurinha" loading="lazy" className="h-32 w-32 object-contain" />;
    case "áudio":
      return <audio controls preload="none" src={src} className="w-64 max-w-full" />;
    case "vídeo":
      return <video controls preload="none" src={src} className="max-h-72 max-w-full rounded-md bg-black" />;
    case "documento":
      return (
        <a href={src} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md bg-black/5 px-3 py-2">
          <span className="text-2xl">📄</span>
          <span className="break-all underline">{m.midia_nome || "Documento"}</span>
        </a>
      );
    default:
      return PREVIA[m.tipo] ? <p className="text-gray-600">{PREVIA[m.tipo]}</p> : null;
  }
}

// Deixa os links da mensagem clicáveis (abrem numa aba nova).
const LINK = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?)\]'"])/gi;
function TextoComLinks({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(LINK).map((parte, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={parte.startsWith("www.") ? `https://${parte}` : parte}
            target="_blank"
            rel="noreferrer noopener"
            className="break-all text-blue-600 underline"
          >
            {parte}
          </a>
        ) : (
          parte
        ),
      )}
    </>
  );
}

export function Bolha({ m }: { m: Mensagem }) {
  const figurinha = m.tipo === "figurinha";
  return (
    <div className={`flex ${m.de_mim ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] space-y-1 rounded-lg px-2 py-1.5 text-sm ${
          figurinha ? "" : m.de_mim ? "bg-[#d9fdd3] shadow-sm" : "bg-white shadow-sm"
        }`}
      >
        <Conteudo m={m} />
        {m.texto && <p className="whitespace-pre-wrap break-words px-1"><TextoComLinks texto={m.texto} />
          </p>}
        <p className="px-1 text-right text-[10px] text-gray-500">{hora(m.enviada_em)}</p>
      </div>
    </div>
  );
}
