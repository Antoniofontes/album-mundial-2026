-- =====================================================================
-- Confirmación mutua de entrega: ambos confirman → colección + limpiar reservas
-- Ejecutar en Supabase después de trade_offers.sql y trade_offers_declined.sql
-- =====================================================================

alter table public.trade_offers
  add column if not exists from_delivered_at timestamptz,
  add column if not exists to_delivered_at timestamptz;

alter table public.trade_offers drop constraint if exists trade_offers_status_check;

alter table public.trade_offers
  add constraint trade_offers_status_check
  check (status in ('pending', 'accepted', 'cancelled', 'declined', 'completed'));

create or replace function public.confirm_trade_delivery(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o record;
  code text;
begin
  select * into o from public.trade_offers where id = p_offer_id for update;
  if not found then raise exception 'offer not found'; end if;
  if o.status <> 'accepted' then raise exception 'not active'; end if;
  if auth.uid() <> o.from_user_id and auth.uid() <> o.to_user_id then
    raise exception 'not participant';
  end if;

  if auth.uid() = o.from_user_id then
    if o.from_delivered_at is null then
      update public.trade_offers set from_delivered_at = now() where id = p_offer_id;
    end if;
  else
    if o.to_delivered_at is null then
      update public.trade_offers set to_delivered_at = now() where id = p_offer_id;
    end if;
  end if;

  select * into o from public.trade_offers where id = p_offer_id;

  if o.from_delivered_at is not null and o.to_delivered_at is not null then
    foreach code in array o.sticker_codes loop
      insert into public.collection (user_id, sticker_code, count, updated_at)
      values (o.to_user_id, code, 1, now())
      on conflict (user_id, sticker_code)
      do update set
        count = public.collection.count + 1,
        updated_at = now();

      update public.collection
      set count = count - 1, updated_at = now()
      where user_id = o.from_user_id and sticker_code = code and count > 0;

      delete from public.collection
      where user_id = o.from_user_id and sticker_code = code and count <= 0;
    end loop;

    delete from public.sticker_reservations where offer_id = p_offer_id;

    update public.trade_offers set status = 'completed' where id = p_offer_id;
  end if;
end;
$$;

grant execute on function public.confirm_trade_delivery(uuid) to authenticated;
