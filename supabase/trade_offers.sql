-- =====================================================================
-- Solicitudes de intercambio entre usuarios + reservas en el álbum
-- Ejecutar en Supabase → SQL Editor después de schema principal.
-- =====================================================================

create table if not exists public.trade_offers (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  sticker_codes text[] not null,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'cancelled', 'declined')),
  created_at timestamptz not null default now(),
  constraint trade_offers_distinct_users check (from_user_id <> to_user_id),
  constraint trade_offers_codes_bounds check (
    cardinality(sticker_codes) >= 1 and cardinality(sticker_codes) <= 450
  )
);

create index if not exists trade_offers_to_pending_idx
  on public.trade_offers (to_user_id, created_at desc)
  where status = 'pending';

create index if not exists trade_offers_from_idx
  on public.trade_offers (from_user_id, created_at desc);

create table if not exists public.sticker_reservations (
  user_id uuid not null references public.profiles(id) on delete cascade,
  sticker_code text not null,
  from_user_id uuid references public.profiles(id) on delete set null,
  offer_id uuid references public.trade_offers(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, sticker_code)
);

create index if not exists sticker_reservations_offer_idx
  on public.sticker_reservations (offer_id);

alter table public.trade_offers enable row level security;
alter table public.sticker_reservations enable row level security;

drop policy if exists "trade_offers_select_participants" on public.trade_offers;
create policy "trade_offers_select_participants"
  on public.trade_offers for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "trade_offers_insert_sender" on public.trade_offers;
create policy "trade_offers_insert_sender"
  on public.trade_offers for insert
  with check (auth.uid() = from_user_id);

drop policy if exists "sticker_reservations_own_select" on public.sticker_reservations;
create policy "sticker_reservations_own_select"
  on public.sticker_reservations for select
  using (auth.uid() = user_id);

drop policy if exists "sticker_reservations_own_delete" on public.sticker_reservations;
create policy "sticker_reservations_own_delete"
  on public.sticker_reservations for delete
  using (auth.uid() = user_id);

-- Envío (evita UPDATE directo en trade_offers desde el cliente)
create or replace function public.send_trade_offer(
  p_to_user_id uuid,
  p_sticker_codes text[],
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if auth.uid() = p_to_user_id then
    raise exception 'invalid recipient';
  end if;
  if cardinality(p_sticker_codes) < 1 or cardinality(p_sticker_codes) > 450 then
    raise exception 'invalid codes length';
  end if;

  insert into public.trade_offers (from_user_id, to_user_id, sticker_codes, note)
  values (
    auth.uid(),
    p_to_user_id,
    p_sticker_codes,
    nullif(trim(coalesce(p_note, '')), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.accept_trade_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o record;
begin
  select * into o from public.trade_offers where id = p_offer_id for update;
  if not found then raise exception 'offer not found'; end if;
  if o.to_user_id <> auth.uid() then raise exception 'not recipient'; end if;
  if o.status <> 'pending' then raise exception 'not pending'; end if;

  update public.trade_offers set status = 'accepted' where id = p_offer_id;

  insert into public.sticker_reservations (user_id, sticker_code, from_user_id, offer_id)
  select auth.uid(), unnest(o.sticker_codes), o.from_user_id, o.id
  on conflict (user_id, sticker_code) do update set
    from_user_id = excluded.from_user_id,
    offer_id = excluded.offer_id,
    created_at = now();
end;
$$;

create or replace function public.cancel_trade_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o record;
begin
  select * into o from public.trade_offers where id = p_offer_id for update;
  if not found then raise exception 'offer not found'; end if;
  if o.from_user_id <> auth.uid() then raise exception 'not sender'; end if;
  if o.status <> 'pending' then raise exception 'not pending'; end if;

  update public.trade_offers set status = 'cancelled' where id = p_offer_id;
end;
$$;

grant execute on function public.send_trade_offer(uuid, text[], text) to authenticated;
grant execute on function public.accept_trade_offer(uuid) to authenticated;
grant execute on function public.cancel_trade_offer(uuid) to authenticated;

create or replace function public.decline_trade_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o record;
begin
  select * into o from public.trade_offers where id = p_offer_id for update;
  if not found then raise exception 'offer not found'; end if;
  if o.to_user_id <> auth.uid() then raise exception 'not recipient'; end if;
  if o.status <> 'pending' then raise exception 'not pending'; end if;

  update public.trade_offers set status = 'declined' where id = p_offer_id;
end;
$$;

grant execute on function public.decline_trade_offer(uuid) to authenticated;
