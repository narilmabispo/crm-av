import Link from "next/link";

export default function Inicio() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6">
      <h1 className="text-4xl font-semibold">Todos os seus clientes e o WhatsApp de cada um num só lugar.</h1>
      <p className="text-lg text-gray-600">
        O CRM AV organiza o perfil de cada cliente e deixa você atender o WhatsApp da empresa dele sem trocar de
        celular ou de aba.
      </p>
      <div className="flex gap-3">
        <Link href="/cadastro" className="botao">
          Criar conta
        </Link>
        <Link href="/login" className="botao-secundario">
          Entrar
        </Link>
      </div>
    </main>
  );
}
