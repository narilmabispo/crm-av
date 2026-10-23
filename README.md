# CRM AV

CRM para assistentes virtuais que atendem os clientes pelo WhatsApp. Feito com Next.js, Supabase e Vercel.

## Etapas

1. Base: login, painel, perfil dos clientes e limite por plano (pronto)
2. Caixa de entrada e chat por cliente
3. Conexão do WhatsApp por QR Code (Evolution API) e status da sessão
4. Assinatura e cobrança pelo Asaas
5. Piloto

## Como colocar no ar

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. No Supabase, abra **SQL Editor**, cole o conteúdo de `supabase/migrations/0001_base.sql` e clique em **Run**.
3. Em **Authentication > URL Configuration**, coloque o endereço do site (ex.: `https://crm-av.vercel.app`) em **Site URL** e adicione `https://crm-av.vercel.app/auth/confirmar` em **Redirect URLs**.
4. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**.
5. Em [vercel.com](https://vercel.com), importe este repositório e, em **Environment Variables**, crie
   `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os valores copiados.
6. Clique em **Deploy**.

Para definir os preços, edite a coluna `preco_centavos` da tabela `planos` no Supabase (ex.: 9700 = R$ 97,00).

## Rodar no computador

```bash
cp .env.example .env.local   # preencha com os dados do Supabase
npm install
npm run dev
```
