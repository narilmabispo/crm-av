# CRM AV

CRM para assistentes virtuais que atendem os clientes pelo WhatsApp. Feito com Next.js, Supabase e Vercel.

## Etapas

1. Base: login, painel, perfil dos clientes e limite por plano (pronto)
2. Caixa de entrada e chat por cliente (pronto: texto; mídias aparecem como [imagem], [áudio] etc.)
3. Conexão do WhatsApp por QR Code (Evolution API) e status da sessão (pronto)
4. Assinatura e cobrança pelo Asaas
5. Piloto

## Como colocar no ar

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. No Supabase, abra **SQL Editor** e rode, nesta ordem, o conteúdo de `supabase/migrations/0001_base.sql` e de `supabase/migrations/0002_whatsapp.sql`.
3. Em **Authentication > URL Configuration**, coloque o endereço do site (ex.: `https://crm-av.vercel.app`) em **Site URL** e adicione `https://crm-av.vercel.app/auth/confirmar` em **Redirect URLs**.
4. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**.
5. Suba a Evolution API (veja abaixo) e anote o endereço e a chave dela.
6. Em [vercel.com](https://vercel.com), importe este repositório e, em **Environment Variables**, crie todas as
   variáveis listadas em `.env.example` com os seus valores.
7. Clique em **Deploy**.

## Evolution API (conexão do WhatsApp por QR Code)

A Evolution API precisa de um servidor ligado 24h. O jeito mais simples é o modelo pronto "Evolution API" do
[Railway](https://railway.com), que já cria o banco que ela usa. Na configuração dele:

- `AUTHENTICATION_API_KEY`: uma senha longa; use o mesmo valor em `EVOLUTION_API_KEY` na Vercel.
- O endereço público gerado pelo Railway vai em `EVOLUTION_API_URL`.

Cada cliente vira uma instância chamada `av-<id do cliente>`, criada pela plataforma quando a assistente clica em
**Conectar WhatsApp**. A conexão por QR Code não é oficial: o WhatsApp pode bloquear um número. Evite mensagens em
massa e mensagens para quem não escreveu antes.

Para definir os preços, edite a coluna `preco_centavos` da tabela `planos` no Supabase (ex.: 9700 = R$ 97,00).

## Rodar no computador

```bash
cp .env.example .env.local   # preencha com os dados do Supabase
npm install
npm run dev
```
