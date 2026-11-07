-- Encrypted money data. The app seals each record before it reaches this table, so
-- amounts, names and notes are never stored in readable form here.
create sequence public.vault_rev_seq;

create table public.vault_records (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('holding', 'asset', 'entry', 'goal', 'snapshot', 'profile', 'brief', 'expenses')),
  id text not null check (length(id) between 1 and 200),
  ciphertext text check (length(ciphertext) <= 400000),
  key_version smallint not null default 1,
  client_updated_at timestamptz not null,
  deleted boolean not null default false,
  rev bigint not null default nextval('public.vault_rev_seq'),
  primary key (user_id, kind, id),
  check (deleted or ciphertext is not null)
);

create index vault_records_user_rev on public.vault_records (user_id, rev);

alter table public.vault_records enable row level security;
alter table public.vault_records force row level security;

create policy "own records: read" on public.vault_records
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "own records: add" on public.vault_records
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own records: change" on public.vault_records
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.vault_records from public, anon, authenticated;
grant select, insert, update on public.vault_records to authenticated;
revoke all on sequence public.vault_rev_seq from public, anon, authenticated;
grant usage on sequence public.vault_rev_seq to authenticated;

-- Saves a batch for the signed-in person. Runs with their rights, so RLS still applies.
-- The newest edit by client time wins, so an old offline edit can't overwrite a newer one.
create function public.vault_push(records jsonb)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.vault_records (user_id, kind, id, ciphertext, key_version, client_updated_at, deleted)
  select
    auth.uid(),
    r.kind,
    r.id,
    case when coalesce(r.deleted, false) then null else r.ciphertext end,
    coalesce(r.key_version, 1),
    r.client_updated_at,
    coalesce(r.deleted, false)
  from jsonb_to_recordset(records) as r(
    kind text, id text, ciphertext text, key_version smallint, client_updated_at timestamptz, deleted boolean
  )
  on conflict (user_id, kind, id) do update
    set ciphertext = excluded.ciphertext,
        key_version = excluded.key_version,
        client_updated_at = excluded.client_updated_at,
        deleted = excluded.deleted,
        rev = nextval('public.vault_rev_seq')
    where public.vault_records.client_updated_at <= excluded.client_updated_at;
$$;

revoke all on function public.vault_push(jsonb) from public, anon;
grant execute on function public.vault_push(jsonb) to authenticated;

-- Deletes the signed-in person's own account. Their records go with it (on delete cascade).
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
