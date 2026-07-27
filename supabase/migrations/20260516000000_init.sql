-- Together schema + RLS
-- Apply with: supabase db push  OR  psql / SQL editor

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  avatar_url text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('creator', 'partner')),
  status text not null check (status in ('active', 'invited', 'left')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table if not exists public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email text not null,
  token text not null unique,
  invited_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  type text not null check (type in ('task', 'decision', 'goal', 'financial_target')),
  title text not null,
  description text,
  status text not null,
  created_by uuid not null references public.profiles(id),
  owner_id uuid references public.profiles(id),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  start_date timestamptz,
  due_date timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_household_idx on public.items (household_id);
create index if not exists items_type_idx on public.items (type);
create index if not exists items_status_idx on public.items (status);
create index if not exists items_owner_idx on public.items (owner_id);
create index if not exists items_due_date_idx on public.items (due_date);

create table if not exists public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.decision_options (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  title text not null,
  description text,
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.decision_responses (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  option_id uuid not null references public.decision_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, user_id)
);

create table if not exists public.goal_details (
  item_id uuid primary key references public.items(id) on delete cascade,
  tracking_type text not null check (tracking_type in ('numeric', 'percentage', 'milestone', 'habit')),
  target_value numeric,
  current_value numeric not null default 0,
  unit text,
  weekly_frequency int,
  streak_count int not null default 0
);

create table if not exists public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  title text not null,
  target_date timestamptz,
  completed_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.financial_details (
  item_id uuid primary key references public.items(id) on delete cascade,
  target_amount_cents integer not null check (target_amount_cents >= 0),
  current_amount_cents integer not null default 0 check (current_amount_cents >= 0)
);

create table if not exists public.financial_contributions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  contributor_id uuid not null references public.profiles(id),
  contributed_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id, emoji)
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete set null,
  uploaded_by uuid not null references public.profiles(id),
  file_name text not null,
  file_url text not null,
  mime_type text not null,
  size_bytes integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  item_id uuid references public.items(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  event_type text not null,
  summary text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  assignments boolean not null default true,
  comments boolean not null default true,
  mentions boolean not null default true,
  decisions boolean not null default true,
  deadlines boolean not null default true,
  contributions boolean not null default true
);

-- Helper: active household membership
create or replace function public.is_household_member(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household
      and hm.user_id = auth.uid()
      and hm.status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;
alter table public.items enable row level security;
alter table public.task_checklist_items enable row level security;
alter table public.decision_options enable row level security;
alter table public.decision_responses enable row level security;
alter table public.goal_details enable row level security;
alter table public.goal_milestones enable row level security;
alter table public.financial_details enable row level security;
alter table public.financial_contributions enable row level security;
alter table public.comments enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.attachments enable row level security;
alter table public.activity_events enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

create policy profiles_select_self_or_partner on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1
      from public.household_members me
      join public.household_members them on them.household_id = me.household_id
      where me.user_id = auth.uid()
        and them.user_id = profiles.id
        and me.status = 'active'
        and them.status = 'active'
    )
  );

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid());

create policy households_member_access on public.households
  for all using (public.is_household_member(id))
  with check (created_by = auth.uid());

create policy household_members_access on public.household_members
  for select using (public.is_household_member(household_id));

create policy items_member_access on public.items
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy comments_member_access on public.comments
  for all using (
    exists (
      select 1 from public.items i
      where i.id = comments.item_id and public.is_household_member(i.household_id)
    )
  )
  with check (
    exists (
      select 1 from public.items i
      where i.id = comments.item_id and public.is_household_member(i.household_id)
    )
  );

create policy notifications_own on public.notifications
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
