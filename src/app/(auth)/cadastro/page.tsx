import Link from "next/link";
import { cadastrar } from "../actions";
import { Campo } from "../Campo";
import { FormAuth } from "../FormAuth";

export default function Cadastro() {
  return (
    <>
      <h1 className="mb-6 text-center text-xl font-bold text-tinta">Crie sua conta gratuita</h1>
      <FormAuth acao={cadastrar} botao="Criar conta">
        <Campo icone="usuario" name="nome" placeholder="Seu nome" required />
        <Campo icone="email" name="email" type="email" placeholder="Seu e-mail" required />
        <Campo icone="cadeado" name="senha" type="password" placeholder="Senha (mínimo 8 caracteres)" required />
      </FormAuth>
      <div className="my-6 flex items-center gap-3 text-sm text-gray-500">
        <span className="h-px flex-1 bg-gray-200" />
        Já tem uma conta?
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <Link href="/login" className="botao-laranja w-full py-3 text-base">
        Entrar
      </Link>
    </>
  );
}
