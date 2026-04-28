-- =====================================================================
-- Estado "declined" + función decline_trade_offer (ejecutar después de trade_offers.sql)
-- =====================================================================

alter table public.trade_offers drop constraint if exists trade_offers_status_check;

alter table public.trade_offers
  add constraint trade_offers_status_check
  check (status in ('pending', 'accepted', 'cancelled', 'declined'));

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
