-- Migration: create projects table for cloud persistence
-- Run this in the Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/imsncpmhtduknumrflod/sql

create table if not exists projects (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  name        text        not null,
  items       jsonb       default '[]'::jsonb not null,
  info        jsonb,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null,
  unique(user_id, name)
);

-- Enable Row Level Security
alter table projects enable row level security;

-- Each user can only access their own projects
create policy "users manage own projects"
  on projects for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: auto-update updated_at on every row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on projects
  for each row execute procedure set_updated_at();
