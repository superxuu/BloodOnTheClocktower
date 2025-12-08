-- Allow update and delete for scripts
create policy "Enable update access for all users" on public.scripts for update using (true);
create policy "Enable delete access for all users" on public.scripts for delete using (true);

-- Allow update and delete for roles
create policy "Enable update access for all users" on public.roles for update using (true);
create policy "Enable delete access for all users" on public.roles for delete using (true);
