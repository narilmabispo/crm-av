import Link from "next/link";
import { entrar, recuperarSenha } from "../actions";
import { Campo } from "../Campo";
import { FormAuth } from "../FormAuth";

type Props = { searchParams: Promise<{ recuperar?: string }> };

export default async function Login({ searchParams }: Props) {
  const { recuperar } = await searchParams;

  if (recuperar) {
    return (
      <>
        <h1 className="mb-2 text-center text-xl font-bold text-tinta">Esqueci minha senha</h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          Digite seu e-mail e enviaremos um link para você criar uma senha nova.
        </p>
        <FormAuth acao={recuperarSenha} botao="Enviar link">
          <Campo icone="email" name="email" type="email" placeholder="Seu e-mail" required />
        </FormAuth>
        <Link href="/login" className="mt-6 block text-center text-sm font-medium text-marca hover:underline">
          Voltar para o login
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-center text-xl font-bold text-tinta">Acesse sua conta</h1>
      <FormAuth acao={entrar} botao="Entrar">
        <Campo icone="email" name="email" type="email" placeholder="Seu e-mail" required />
        <Campo icone="cadeado" name="senha" type="password" placeholder="Sua senha" required />
        <div className="-mt-1 text-right">
          <Link href="/login?recuperar=1" className="text-sm text-marca underline-offset-2 hover:underline">
            Esqueci minha senha
          </Link>
        </div>
      </FormAuth>
      <div className="my-6 flex items-center gap-3 text-sm text-gray-500">
        <span className="h-px flex-1 bg-gray-200" />
        Ainda não tem uma conta?
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <Link href="/cadastro" className="botao-laranja w-full py-3 text-base">
        Criar minha conta gratuita
      </Link>
    </>
  );
}
