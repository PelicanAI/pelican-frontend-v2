-- Create user analytics table for tracking usage
create table if not exists public.user_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_messages integer default 0,
  total_conversations integer default 0,
  last_active timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_analytics enable row level security;

-- Create policies for user analytics
create policy "user_analytics_select_own"
  on public.user_analytics for select
  using (auth.uid() = user_id);

create policy "user_analytics_insert_own"
  on public.user_analytics for insert
  with check (auth.uid() = user_id);

create policy "user_analytics_update_own"
  on public.user_analytics for update
  using (auth.uid() = user_id);

create policy "user_analytics_delete_own"
  on public.user_analytics for delete
  using (auth.uid() = user_id);
