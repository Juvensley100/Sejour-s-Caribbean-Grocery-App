create extension if not exists "pgcrypto";

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  category text,
  quantity integer not null default 0 check (quantity >= 0),
  price numeric(10,2) not null default 0 check (price >= 0),
  image_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists inventory_items_set_updated_at on public.inventory_items;

create trigger inventory_items_set_updated_at
before update on public.inventory_items
for each row
execute function public.set_updated_at();

alter table public.inventory_items enable row level security;

-- For MVP/demo: allow public read-write with anon key.
-- Tighten policies before production launch.
drop policy if exists "inventory read" on public.inventory_items;
create policy "inventory read"
on public.inventory_items
for select
using (true);

drop policy if exists "inventory write" on public.inventory_items;
create policy "inventory write"
on public.inventory_items
for all
using (true)
with check (true);
