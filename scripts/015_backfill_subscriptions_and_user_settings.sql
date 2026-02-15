-- Backfill subscriptions and user_settings for existing auth users

begin;

-- 1) Backfill subscriptions (starter/inactive)
insert into public.subscriptions (user_id, plan, status)
select
  u.id as user_id,
  'starter'::plan_type as plan,
  'inactive'::subscription_status as status
from auth.users u
left join public.subscriptions s on s.user_id = u.id
where s.user_id is null;

-- 2) Backfill user_settings with identity defaults
insert into public.user_settings (
  user_id,
  workspace_name,
  primary_contact,
  region
)
select
  u.id as user_id,
  case
    when coalesce(
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'fullName',
      u.raw_user_meta_data ->> 'name'
    ) is null then null
    else coalesce(
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'fullName',
      u.raw_user_meta_data ->> 'name'
    ) || ' Workspace'
  end as workspace_name,
  u.email as primary_contact,
  u.raw_user_meta_data ->> 'region' as region
from auth.users u
left join public.user_settings us on us.user_id = u.id
where us.user_id is null;

commit;