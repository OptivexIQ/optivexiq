begin;

alter table public.user_settings
  add column if not exists currency text;

update public.user_settings
set currency = coalesce(currency, 'USD')
where currency is null;

alter table public.user_settings
  alter column currency set default 'USD';

alter table public.user_settings
  alter column currency set not null;

alter table public.user_settings
  drop constraint if exists user_settings_currency_check;

alter table public.user_settings
  add constraint user_settings_currency_check
  check (currency in ('USD', 'EUR', 'GBP')) not valid;

commit;
