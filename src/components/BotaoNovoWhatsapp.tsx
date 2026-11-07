import Link from "next/link";
import { Icone } from "./Icone";

export function BotaoNovoWhatsapp({ podeAdicionar }: { podeAdicionar: boolean }) {
  return podeAdicionar ? (
    <Link href="/clientes/novo" className="botao">
      <Icone nome="mais" /> Conectar novo WhatsApp
    </Link>
  ) : (
    <Link href="/conta" className="botao-laranja" title="Seu plano chegou ao limite de clientes">
      Aumentar plano
    </Link>
  );
}
