-- Etapa 1: assistentes, planos, assinaturas e clientes.
-- Cada assistente só enxerga as próprias linhas (Row Level Security).

create table public.planos (
  id text primary key,
  nome text not null,
  limite_clientes int not null check (limite_clientes > 0),
  preco_centavos int not null default 0,
  ativo boolean not null default true
);

insert into public.planos (id, nome, limite_clientes, preco_centavos) values
  ('plano_3', 'Plano 3 clientes', 3, 0),
  ('plano_5', 'Plano 5 clientes', 5, 0);

create table public.assistentes (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  telefone text,
  criado_em timestamptz not null default now()
);

create table public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  assistente_id uuid not null unique references public.assistentes (id) on delete cascade,
  plano_id text not null references public.planos (id),
  status text not null default 'teste' check (status in ('teste', 'ativa', 'atrasada', 'cancelada')),
  proxima_cobranca date,
  asaas_assinatura_id text,
  criado_em timestamptz not null default now()
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  assistente_id uuid not null references public.assistentes (id) on delete cascade,
  nome text not null,
  profissao text,
  cidade text,
  empresa text,
  observacoes text,
  criado_em timestamptz not null default now()
);

create index clientes_assistente_idx on public.clientes (assistente_id);

-- Novo usuário: cria o perfil da assistente e uma assinatura de teste no Plano 3.
create function public.novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.assistentes (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', ''));
  insert into public.assinaturas (assistente_id, plano_id) values (new.id, 'plano_3');
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.novo_usuario();

-- Impede cadastrar clientes além do limite do plano.
create function public.verificar_limite_clientes() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  limite int;
  total int;
begin
  select p.limite_clientes into limite
  from public.assinaturas a join public.planos p on p.id = a.plano_id
  where a.assistente_id = new.assistente_id and a.status in ('teste', 'ativa');

  if limite is null then
    raise exception 'ASSINATURA_INATIVA';
  end if;

  select count(*) into total from public.clientes where assistente_id = new.assistente_id;
  if total >= limite then
    raise exception 'LIMITE_CLIENTES';
  end if;
  return new;
end;
$$;

create trigger limite_clientes
  before insert on public.clientes
  for each row execute function public.verificar_limite_clientes();

alter table public.planos enable row level security;
alter table public.assistentes enable row level security;
alter table public.assinaturas enable row level security;
alter table public.clientes enable row level security;

create policy "planos visíveis" on public.planos for select using (ativo);

create policy "própria assistente" on public.assistentes
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "própria assinatura" on public.assinaturas
  for select using (assistente_id = auth.uid());

create policy "próprios clientes" on public.clientes
  for all using (assistente_id = auth.uid()) with check (assistente_id = auth.uid());
