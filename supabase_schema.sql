-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create scripts table
create table public.scripts (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  author text,
  type text default 'custom',
  description text,
  json_url text -- Optional: link to original file if needed
);

-- Create roles table
create table public.roles (
  id uuid default uuid_generate_v4() primary key,
  script_id uuid references public.scripts(id) on delete cascade not null,
  name text not null,
  team text not null, -- 'townsfolk', 'outsider', 'minion', 'demon'
  ability text,
  first_night boolean default false,
  other_night boolean default false
);

-- Enable Row Level Security (RLS)
alter table public.scripts enable row level security;
alter table public.roles enable row level security;

-- Create policies
-- Allow anyone to read scripts and roles
create policy "Enable read access for all users" on public.scripts for select using (true);
create policy "Enable read access for all users" on public.roles for select using (true);

-- Allow anyone to insert scripts and roles (since we don't have user auth yet)
create policy "Enable insert access for all users" on public.scripts for insert with check (true);
create policy "Enable insert access for all users" on public.roles for insert with check (true);
