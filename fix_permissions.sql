-- Fix permissions for scripts and roles tables
-- This script will DROP all existing policies and recreate them to ensure
-- that ALL users (anonymous and authenticated) have full CRUD access.

-- 1. Enable RLS (just in case)
alter table public.scripts enable row level security;
alter table public.roles enable row level security;

-- 2. Drop ALL existing policies to avoid conflicts
drop policy if exists "Enable read access for all users" on public.scripts;
drop policy if exists "Enable insert access for all users" on public.scripts;
drop policy if exists "Enable update access for all users" on public.scripts;
drop policy if exists "Enable delete access for all users" on public.scripts;

drop policy if exists "Enable read access for all users" on public.roles;
drop policy if exists "Enable insert access for all users" on public.roles;
drop policy if exists "Enable update access for all users" on public.roles;
drop policy if exists "Enable delete access for all users" on public.roles;

-- 3. Create comprehensive policies for SCRIPTS
-- Allow SELECT
create policy "Enable read access for all users"
on public.scripts for select
using (true);

-- Allow INSERT
create policy "Enable insert access for all users"
on public.scripts for insert
with check (true);

-- Allow UPDATE
create policy "Enable update access for all users"
on public.scripts for update
using (true);

-- Allow DELETE
create policy "Enable delete access for all users"
on public.scripts for delete
using (true);


-- 4. Create comprehensive policies for ROLES
-- Allow SELECT
create policy "Enable read access for all users"
on public.roles for select
using (true);

-- Allow INSERT
create policy "Enable insert access for all users"
on public.roles for insert
with check (true);

-- Allow UPDATE
create policy "Enable update access for all users"
on public.roles for update
using (true);

-- Allow DELETE
create policy "Enable delete access for all users"
on public.roles for delete
using (true);
