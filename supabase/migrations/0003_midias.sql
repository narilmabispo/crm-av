-- Fotos, áudios, vídeos, documentos e figurinhas no chat.

alter table public.mensagens
  add column if not exists midia_path text,
  add column if not exists midia_mimetype text,
  add column if not exists midia_nome text;

-- Pasta privada de arquivos. Cada assistente só acessa a subpasta com o próprio id.
insert into storage.buckets (id, name, public)
values ('midias', 'midias', false)
on conflict (id) do nothing;

create policy "própria pasta de mídias - ler" on storage.objects
  for select to authenticated
  using (bucket_id = 'midias' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "própria pasta de mídias - enviar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'midias' and (storage.foldername(name))[1] = auth.uid()::text);
