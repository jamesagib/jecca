-- Create reminders table
create table public.reminders (
    id bigint primary key,
    title text not null,
    time text not null,
    date text not null,
    notification_id text,
    completed boolean default false,
    user_id uuid references auth.users(id) on delete cascade not null,
    user_email text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    synced_at timestamptz default now()
);

-- Enable RLS
alter table public.reminders enable row level security;

-- Create policy to allow users to read their own reminders
create policy "Users can read their own reminders"
on public.reminders
for select
using (auth.uid() = user_id);

-- Create policy to allow users to insert their own reminders
create policy "Users can insert their own reminders"
on public.reminders
for insert
with check (auth.uid() = user_id);

-- Create policy to allow users to update their own reminders
create policy "Users can update their own reminders"
on public.reminders
for update
using (auth.uid() = user_id);

-- Create policy to allow users to delete their own reminders
create policy "Users can delete their own reminders"
on public.reminders
for delete
using (auth.uid() = user_id);

-- Create function to sync user_email from auth.users
create or replace function sync_user_email()
returns trigger
language plpgsql
security definer
as $$
begin
  new.user_email = (
    select email 
    from auth.users 
    where id = new.user_id
  );
  return new;
end;
$$;

-- Create trigger to automatically sync user_email on insert/update
create trigger sync_user_email_trigger
  before insert or update
  on public.reminders
  for each row
  execute function sync_user_email();

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger handle_reminders_updated_at
    before update on public.reminders
    for each row
    execute function public.handle_updated_at();

-- Create push_tokens table
create table public.push_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    push_token text not null,
    device_id text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id, push_token)
);

-- Enable RLS
alter table public.push_tokens enable row level security;

-- Create policy to allow users to manage their own push tokens
create policy "Users can manage their own push tokens"
on public.push_tokens
for all
using (auth.uid() = user_id);

-- Create updated_at trigger for push_tokens
create trigger handle_push_tokens_updated_at
    before update on public.push_tokens
    for each row
    execute function public.handle_updated_at();