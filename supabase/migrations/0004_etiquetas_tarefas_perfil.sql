-- Etiquetas, tarefas, relatórios e perfil da assistente.

-- Perfil: dados extras da assistente.
alter table public.assistentes
  add column if not exists cidade text,
  add column if not exists documento text,
  add column if not exists instagram text;

-- Planos: descrição e o que cada um inclui (aparecem no Perfil > Financeiro).
alter table public.planos
  add column if not exists descricao text,
  add column if not exists recursos text[] not null default '{}';

update public.planos set
  descricao = 'Para quem está começando a atender clientes.',
  recursos = array['Até 3 WhatsApps de clientes', 'Etiquetas e tarefas', 'Relatórios mensais por cliente']
where id = 'plano_3' and descricao is null;

update public.planos set
  descricao = 'Para quem já tem uma carteira maior de clientes.',
  recursos = array['Até 5 WhatsApps de clientes', 'Etiquetas e tarefas', 'Relatórios mensais por cliente']
where id = 'plano_5' and descricao is null;

-- Etiquetas coloridas da assistente, usadas nas conversas de todos os clientes.
create table if not exists public.etiquetas (
  id uuid primary key default gen_random_uuid(),
  assistente_id uuid not null default auth.uid() references public.assistentes (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  cor text not null default 'roxo',
  criado_em timestamptz not null default now(),
  unique (assistente_id, nome)
);

create table if not exists public.conversa_etiquetas (
  conversa_id uuid not null references public.conversas (id) on delete cascade,
  etiqueta_id uuid not null references public.etiquetas (id) on delete cascade,
  assistente_id uuid not null default auth.uid() references public.assistentes (id) on delete cascade,
  primary key (conversa_id, etiqueta_id)
);

create index if not exists conversa_etiquetas_etiqueta_idx on public.conversa_etiquetas (etiqueta_id);

-- Tarefas: o que a assistente precisa fazer, ligado (ou não) a um cliente e a uma conversa.
create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  assistente_id uuid not null default auth.uid() references public.assistentes (id) on delete cascade,
  cliente_id uuid references public.clientes (id) on delete cascade,
  conversa_id uuid references public.conversas (id) on delete set null,
  titulo text not null check (length(trim(titulo)) > 0),
  vence_em date,
  feita boolean not null default false,
  feita_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists tarefas_assistente_idx on public.tarefas (assistente_id, feita, vence_em);

alter table public.etiquetas enable row level security;
alter table public.conversa_etiquetas enable row level security;
alter table public.tarefas enable row level security;

drop policy if exists "próprias etiquetas" on public.etiquetas;
create policy "próprias etiquetas" on public.etiquetas
  for all using (assistente_id = auth.uid()) with check (assistente_id = auth.uid());

drop policy if exists "próprias marcações" on public.conversa_etiquetas;
create policy "próprias marcações" on public.conversa_etiquetas
  for all using (assistente_id = auth.uid())
  with check (
    assistente_id = auth.uid()
    and exists (select 1 from public.conversas c where c.id = conversa_id and c.assistente_id = auth.uid())
    and exists (select 1 from public.etiquetas e where e.id = etiqueta_id and e.assistente_id = auth.uid())
  );

drop policy if exists "próprias tarefas" on public.tarefas;
create policy "próprias tarefas" on public.tarefas
  for all using (assistente_id = auth.uid())
  with check (
    assistente_id = auth.uid()
    and (cliente_id is null or exists (select 1 from public.clientes c where c.id = cliente_id and c.assistente_id = auth.uid()))
  );

-- Relatório de atendimentos: números por cliente e por dia (horário de Brasília).
-- Linhas com dia vazio trazem o total do período de cada cliente.
-- Tempo de resposta: da mensagem recebida até a primeira resposta da assistente (respostas em até 24h).
create or replace function public.relatorio_atendimentos(p_inicio timestamptz, p_fim timestamptz)
returns table (
  cliente_id uuid,
  dia date,
  conversas int,
  atendidas int,
  recebidas int,
  enviadas int,
  respostas int,
  soma_resposta_seg bigint
)
language sql stable security invoker set search_path = public as $$
  with base as (
    select
      c.cliente_id,
      m.conversa_id,
      m.de_mim,
      m.enviada_em,
      lag(m.de_mim) over w as anterior_de_mim,
      lag(m.enviada_em) over w as anterior_em
    from public.mensagens m
    join public.conversas c on c.id = m.conversa_id
    where m.enviada_em >= p_inicio - interval '1 day' and m.enviada_em < p_fim
    window w as (partition by m.conversa_id order by m.enviada_em)
  ),
  periodo as (
    select *,
      (de_mim and anterior_de_mim = false and enviada_em - anterior_em < interval '24 hours') as eh_resposta
    from base
    where enviada_em >= p_inicio
  )
  select
    cliente_id,
    (enviada_em at time zone 'America/Sao_Paulo')::date as dia,
    count(distinct conversa_id)::int,
    count(distinct conversa_id) filter (where de_mim)::int,
    count(*) filter (where not de_mim)::int,
    count(*) filter (where de_mim)::int,
    count(*) filter (where eh_resposta)::int,
    coalesce(sum(extract(epoch from enviada_em - anterior_em)) filter (where eh_resposta), 0)::bigint
  from periodo
  group by grouping sets ((cliente_id, (enviada_em at time zone 'America/Sao_Paulo')::date), (cliente_id))
$$;

grant execute on function public.relatorio_atendimentos(timestamptz, timestamptz) to authenticated;
