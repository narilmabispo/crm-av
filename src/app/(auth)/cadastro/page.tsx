import Link from "next/link";
import { cadastrar } from "../actions";
import { FormAuth } from "../FormAuth";

export default function Cadastro() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Criar conta</h1>
      <FormAuth acao={cadastrar} botao="Criar conta">
        <input name="nome" placeholder="Seu nome" required className="campo" />
        <input name="email" type="email" placeholder="E-mail" required className="campo" />
        <input name="senha" type="password" placeholder="Senha (mínimo 8 caracteres)" required className="campo" />
      </FormAuth>
      <p className="mt-6 text-sm text-gray-600">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-marca">
          Entrar
        </Link>
      </p>
    </>
  );
}
