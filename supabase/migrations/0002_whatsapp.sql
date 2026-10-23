-- Etapas 2 e 3: conexão do WhatsApp por cliente, conversas e mensagens.

create table public.conexoes_whatsapp (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null unique references public.clientes (id) on delete cascade,
  assistente_id uuid not null references public.assistentes (id) on delete cascade,
  instancia text not null unique,
  status text not null default 'desconectado' check (status in ('desconectado', 'aguardando_qr', 'conectado')),
  qr_code text,
  numero text,
  atualizado_em timestamptz not null default now()
);

create table public.conversas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  assistente_id uuid not null references public.assistentes (id) on delete cascade,
  jid text not null,
  nome text,
  ultima_mensagem text,
  ultima_em timestamptz,
  nao_lidas int not null default 0,
  unique (cliente_id, jid)
);

create index conversas_cliente_idx on public.conversas (cliente_id, ultima_em desc);

create table public.mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.conversas (id) on delete cascade,
  assistente_id uuid not null references public.assistentes (id) on delete cascade,
  wa_id text not null,
  de_mim boolean not null,
  tipo text not null default 'texto',
  texto text,
  enviada_em timestamptz not null default now(),
  unique (conversa_id, wa_id)
);

create index mensagens_conversa_idx on public.mensagens (conversa_id, enviada_em);

alter table public.conexoes_whatsapp enable row level security;
alter table public.conversas enable row level security;
alter table public.mensagens enable row level security;

-- A conexão é criada e atualizada pelo servidor (chave de serviço); a assistente só lê.
create policy "própria conexão" on public.conexoes_whatsapp
  for select using (assistente_id = auth.uid());

create policy "próprias conversas" on public.conversas
  for select using (assistente_id = auth.uid());
create policy "zerar não lidas" on public.conversas
  for update using (assistente_id = auth.uid()) with check (assistente_id = auth.uid());

create policy "próprias mensagens" on public.mensagens
  for select using (assistente_id = auth.uid());

-- Mensagens e conversas novas aparecem na tela sem recarregar.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.mensagens, public.conversas, public.conexoes_whatsapp;
  end if;
end;
$$;
