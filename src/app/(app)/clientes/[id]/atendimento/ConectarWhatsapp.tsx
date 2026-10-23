"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { conectarWhatsapp, verificarConexao, type Conexao } from "./actions";

type Props = { clienteId: string; nomeCliente: string; conexao: Conexao | null };

export function ConectarWhatsapp({ clienteId, nomeCliente, conexao: inicial }: Props) {
  const router = useRouter();
  const [conexao, setConexao] = useState<Conexao | null>(inicial);
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();
  const aguardando = conexao?.status === "aguardando_qr";

  useEffect(() => {
    if (!aguardando) return;
    const timer = setInterval(async () => {
      const atual = await verificarConexao(clienteId);
      setConexao(atual);
      if (atual.status === "conectado") router.refresh();
    }, 3000);
    return () => clearInterval(timer);
  }, [aguardando, clienteId, router]);

  const conectar = () =>
    iniciar(async () => {
      setErro(undefined);
      try {
        setConexao(await conectarWhatsapp(clienteId));
      } catch {
        setErro("Não foi possível gerar o QR Code. Verifique se o servidor do WhatsApp está no ar.");
      }
    });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
      {aguardando ? (
        <>
          <p className="text-lg font-medium">Escaneie o QR Code com o WhatsApp de {nomeCliente}</p>
          <p className="mt-2 text-sm text-gray-600">
            No celular da empresa: WhatsApp → Mais opções → Aparelhos conectados → Conectar um aparelho.
          </p>
          {conexao?.qr_code ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={conexao.qr_code} alt="QR Code do WhatsApp" className="mx-auto mt-6 h-64 w-64" />
          ) : (
            <p className="mt-6 text-sm text-gray-500">Gerando QR Code...</p>
          )}
          <button onClick={conectar} className="botao-secundario mt-6" disabled={pendente}>
            Gerar novo QR Code
          </button>
        </>
      ) : (
        <>
          <p className="text-lg font-medium">WhatsApp não conectado</p>
          <p className="mt-2 text-sm text-gray-600">
            Conecte o WhatsApp da empresa de {nomeCliente} para atender as conversas por aqui. O celular continua
            funcionando normalmente.
          </p>
          <button onClick={conectar} className="botao mt-6" disabled={pendente}>
            {pendente ? "Gerando QR Code..." : "Conectar WhatsApp"}
          </button>
        </>
      )}
      {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}
    </div>
  );
}
