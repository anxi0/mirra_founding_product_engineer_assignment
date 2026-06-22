-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                      uuid primary key references auth.users on delete cascade,
  email                   text not null,
  survey_choice           smallint check (survey_choice between 1 and 5),
  onboarding_completed_at timestamptz,
  created_at              timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "own profile" on public.profiles
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── connected_accounts ───────────────────────────────────────────────────────
create table if not exists public.connected_accounts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  platform         text not null check (platform in ('instagram', 'tiktok', 'kakao')),
  is_active        boolean default true not null,
  token_expires_at timestamptz,
  connected_at     timestamptz default now() not null,
  unique (user_id, platform)
);

alter table public.connected_accounts enable row level security;

create policy "own accounts" on public.connected_accounts
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── onboarding_events ────────────────────────────────────────────────────────
create table if not exists public.onboarding_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  event_name text not null,
  properties jsonb,
  created_at timestamptz default now() not null
);

alter table public.onboarding_events enable row level security;

create policy "own events" on public.onboarding_events
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on public.onboarding_events (user_id, event_name);

-- ── auto-create profile on signup ────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
