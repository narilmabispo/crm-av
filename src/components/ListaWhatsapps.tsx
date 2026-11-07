import Link from "next/link";
import { corAvatar, formatarNumero, iniciais, type ResumoWhatsapp, type StatusConexao } from "@/lib/whatsapps";
import { Icone } from "./Icone";

const STATUS: Record<StatusConexao, { texto: string; classe: string; ponto: string }> = {
  conectado: { texto: "Conectado", classe: "bg-emerald-50 text-emerald-700", ponto: "bg-emerald-500" },
  aguardando_qr: { texto: "Aguardando QR Code", classe: "bg-amber-50 text-amber-700", ponto: "bg-amber-500" },
  desconectado: { texto: "Desconectado", classe: "bg-gray-100 text-gray-600", ponto: "bg-gray-400" },
};

export function SeloStatus({ status }: { status: StatusConexao }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.classe}`}>
      <span className={`h-2 w-2 rounded-full ${s.ponto}`} />
      {s.texto}
    </span>
  );
}

export function Avatar({ nome, conectado, tamanho = "h-12 w-12" }: { nome: string; conectado?: boolean; tamanho?: string }) {
  return (
    <span className="relative shrink-0">
      <span className={`titulo flex ${tamanho} items-center justify-center rounded-full font-semibold ${corAvatar(nome)}`}>
        {iniciais(nome)}
      </span>
      {conectado && (
        <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
          <Icone nome="whatsapp" className="h-3 w-3" />
        </span>
      )}
    </span>
  );
}

// Lista "Seus WhatsApps": um item por cliente, com status da conexão e conversas não lidas.
export function ListaWhatsapps({ itens }: { itens: ResumoWhatsapp[] }) {
  if (itens.length === 0) {
    return (
      <div className="cartao border-dashed p-10 text-center text-gray-600">
        Você ainda não cadastrou clientes. Clique em <strong>Conectar novo WhatsApp</strong> para começar.
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {itens.map((w) => {
        const link = `/clientes/${w.id}?aba=atendimento`;
        return (
          <li key={w.id} className="cartao relative flex items-center gap-4 p-4 transition hover:border-lilas hover:shadow-md">
            <Avatar nome={w.nome} conectado={w.status === "conectado"} />
            <Link href={link} className="min-w-0 flex-1 after:absolute after:inset-0">
              <p className="titulo truncate font-semibold text-tinta">{w.nome}</p>
              <p className="truncate text-sm text-gray-500">{formatarNumero(w.numero) ?? (w.detalhe || "WhatsApp ainda não conectado")}</p>
            </Link>
            <span className="hidden sm:block">
              <SeloStatus status={w.status} />
            </span>
            <span
              className={`min-w-8 rounded-full px-2.5 py-0.5 text-center text-sm font-semibold ${
                w.naoLidas > 0 ? "bg-marca text-white" : "bg-gray-100 text-gray-400"
              }`}
              title="Conversas não lidas"
            >
              {w.naoLidas}
            </span>
            <details className="relative z-10">
              <summary className="cursor-pointer rounded-lg p-1.5 text-gray-500 hover:bg-lavanda" aria-label="Mais opções">
                <Icone nome="pontos" />
              </summary>
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-gray-100 bg-white p-1.5 text-sm shadow-lg">
                <Link href={link} className="block rounded-lg px-3 py-2 hover:bg-lavanda">
                  {w.status === "conectado" ? "Abrir atendimento" : "Conectar WhatsApp"}
                </Link>
                <Link href={`/clientes/${w.id}?aba=perfil`} className="block rounded-lg px-3 py-2 hover:bg-lavanda">
                  Editar perfil do cliente
                </Link>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
