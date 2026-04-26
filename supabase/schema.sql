-- =====================================================================
-- Álbum Mundial 2026 - Schema Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

-- 1. Perfiles públicos (un perfil por usuario auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Colección: estado de cada figurita por usuario
-- count = 0 → falta, 1 → tengo (pegada), >1 → repetidas para intercambiar
create table if not exists public.collection (
  user_id uuid not null references public.profiles(id) on delete cascade,
  sticker_number int not null check (sticker_number between 1 and 980),
  count int not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, sticker_number)
);

create index if not exists collection_sticker_idx on public.collection(sticker_number);
create index if not exists collection_user_idx on public.collection(user_id);

-- 3. Personas que "marca" un usuario sin que estén registradas
-- (para cuando armás listas tipo "esta la tiene Juan, esta la tiene Pedro")
create table if not exists public.marked_friends (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

-- 4. Tabla de "X tiene esta figurita" — quién tiene qué (manual)
create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  sticker_number int not null check (sticker_number between 1 and 980),
  -- Apunta a un amigo marcado a mano O a un perfil real:
  marked_friend_id uuid references public.marked_friends(id) on delete cascade,
  friend_user_id uuid references public.profiles(id) on delete cascade,
  count int not null default 1,
  created_at timestamptz not null default now(),
  check (
    (marked_friend_id is not null and friend_user_id is null) or
    (marked_friend_id is null and friend_user_id is not null)
  )
);

create index if not exists holdings_owner_idx on public.holdings(owner_id);
create index if not exists holdings_sticker_idx on public.holdings(sticker_number);

-- 5. Foto del álbum subida (para escaneo IA)
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  detected_numbers int[] not null default '{}',
  status text not null default 'pending', -- pending|processing|done|error
  error text,
  applied boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists scans_user_idx on public.scans(user_id);

-- =====================================================================
-- RLS (Row Level Security)
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.collection enable row level security;
alter table public.marked_friends enable row level security;
alter table public.holdings enable row level security;
alter table public.scans enable row level security;

-- Profiles públicos pueden ser leídos por cualquiera (modo invitado)
drop policy if exists "Public profiles are viewable" on public.profiles;
create policy "Public profiles are viewable"
  on public.profiles for select
  using (is_public = true or auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Collection: cualquiera puede leer la colección de un perfil público (read-only invitado),
-- pero sólo el dueño la modifica.
drop policy if exists "View collection of public profile" on public.collection;
create policy "View collection of public profile"
  on public.collection for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = collection.user_id
        and (p.is_public = true or p.id = auth.uid())
    )
  );

drop policy if exists "Owner can write collection" on public.collection;
create policy "Owner can write collection"
  on public.collection for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Marked friends: privados al dueño
drop policy if exists "Owner can read friends" on public.marked_friends;
create policy "Owner can read friends"
  on public.marked_friends for select
  using (auth.uid() = owner_id);

drop policy if exists "Owner can write friends" on public.marked_friends;
create policy "Owner can write friends"
  on public.marked_friends for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Holdings: el dueño es quien las gestiona; visibles para él
drop policy if exists "Owner can read holdings" on public.holdings;
create policy "Owner can read holdings"
  on public.holdings for select
  using (auth.uid() = owner_id);

drop policy if exists "Owner can write holdings" on public.holdings;
create policy "Owner can write holdings"
  on public.holdings for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Scans: privados
drop policy if exists "Owner can read scans" on public.scans;
create policy "Owner can read scans"
  on public.scans for select
  using (auth.uid() = user_id);

drop policy if exists "Owner can write scans" on public.scans;
create policy "Owner can write scans"
  on public.scans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================================================================
-- VIEWS para la API y Leaderboard
-- =====================================================================

-- Estadísticas por usuario (públicas, computadas a demanda)
drop view if exists public.user_stats cascade;
create or replace view public.user_stats as
select
  p.id as user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.is_public,
  coalesce(sum(case when c.count > 0 then 1 else 0 end), 0)::int as owned,
  coalesce(sum(case when c.count > 1 then c.count - 1 else 0 end), 0)::int as duplicates,
  coalesce(sum(c.count), 0)::int as total_count,
  980 - coalesce(sum(case when c.count > 0 then 1 else 0 end), 0)::int as missing
from public.profiles p
left join public.collection c on c.user_id = p.id
group by p.id, p.username, p.display_name, p.avatar_url, p.is_public;

grant select on public.user_stats to anon, authenticated;

-- =====================================================================
-- Trigger para crear profile automáticamente al registrarse
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  i int := 0;
begin
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'));
  if base_username is null or length(base_username) < 3 then
    base_username := 'user' || substr(new.id::text, 1, 8);
  end if;
  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    i := i + 1;
    candidate := base_username || i::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data->>'display_name', candidate)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Storage: bucket para fotos del álbum
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('album-scans', 'album-scans', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload own scans" on storage.objects;
create policy "Users can upload own scans"
  on storage.objects for insert
  with check (
    bucket_id = 'album-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can read own scans" on storage.objects;
create policy "Users can read own scans"
  on storage.objects for select
  using (
    bucket_id = 'album-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own scans" on storage.objects;
create policy "Users can delete own scans"
  on storage.objects for delete
  using (
    bucket_id = 'album-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
