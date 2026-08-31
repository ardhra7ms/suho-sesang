create table if not exists public.user_worlds (
  user_id uuid primary key references auth.users(id) on delete cascade,
  world jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_worlds enable row level security;

drop policy if exists "Users can read their world" on public.user_worlds;
create policy "Users can read their world"
on public.user_worlds for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their world" on public.user_worlds;
create policy "Users can create their world"
on public.user_worlds for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their world" on public.user_worlds;
create policy "Users can update their world"
on public.user_worlds for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.user_elements (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.user_elements enable row level security;

drop policy if exists "Users can read their elements" on public.user_elements;
create policy "Users can read their elements"
on public.user_elements for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their elements" on public.user_elements;
create policy "Users can create their elements"
on public.user_elements for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their elements" on public.user_elements;
create policy "Users can update their elements"
on public.user_elements for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their elements" on public.user_elements;
create policy "Users can delete their elements"
on public.user_elements for delete
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('user-elements', 'user-elements', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can read their element files" on storage.objects;
create policy "Users can read their element files"
on storage.objects for select
using (
  bucket_id = 'user-elements'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can create their element files" on storage.objects;
create policy "Users can create their element files"
on storage.objects for insert
with check (
  bucket_id = 'user-elements'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their element files" on storage.objects;
create policy "Users can update their element files"
on storage.objects for update
using (
  bucket_id = 'user-elements'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'user-elements'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their element files" on storage.objects;
create policy "Users can delete their element files"
on storage.objects for delete
using (
  bucket_id = 'user-elements'
  and (storage.foldername(name))[1] = auth.uid()::text
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_worlds'
  ) then
    alter publication supabase_realtime add table public.user_worlds;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_elements'
  ) then
    alter publication supabase_realtime add table public.user_elements;
  end if;
end
$$;
