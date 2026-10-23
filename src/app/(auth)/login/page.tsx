import Link from "next/link";
import { entrar, recuperarSenha } from "../actions";
import { FormAuth } from "../FormAuth";

export default function Login() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Entrar</h1>
      <FormAuth acao={entrar} botao="Entrar">
        <input name="email" type="email" placeholder="E-mail" required className="campo" />
        <input name="senha" type="password" placeholder="Senha" required className="campo" />
      </FormAuth>
      <details className="mt-6 text-sm">
        <summary className="cursor-pointer text-gray-600">Esqueci minha senha</summary>
        <div className="mt-3">
          <FormAuth acao={recuperarSenha} botao="Enviar link">
            <input name="email" type="email" placeholder="E-mail" required className="campo" />
          </FormAuth>
        </div>
      </details>
      <p className="mt-6 text-sm text-gray-600">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-marca">
          Criar conta
        </Link>
      </p>
    </>
  );
}
