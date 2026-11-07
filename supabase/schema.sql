-- Àṣọ African Fashion Catalogue
-- Run in Supabase SQL Editor. This script is designed for a new project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  cover_image_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'NGN',
  category_id uuid references public.categories(id) on delete set null,
  collection_id uuid references public.collections(id) on delete set null,
  fabric text,
  fit text,
  care_instructions text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  storage_path text,
  alt_text text,
  display_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists products_status_created_idx on public.products(status, created_at desc);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_collection_idx on public.products(collection_id);
create index if not exists product_images_product_idx on public.product_images(product_id, display_order);

-- Create a profile whenever a user registers. Role is always customer by default.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Prevent a signed-in user from promoting themselves (or another user) to owner.
create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and new.role is distinct from old.role then
    raise exception 'Profile role cannot be changed from the client';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before update on public.profiles
for each row execute procedure public.prevent_profile_role_escalation();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

-- Helper: only profiles explicitly promoted to owner can administer catalogue data.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'owner'
  );
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

-- Profiles: users can read and update their own non-role profile fields.
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_owner());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Categories and collections: public reads active records; owner manages all.
drop policy if exists "Public read active categories" on public.categories;
create policy "Public read active categories"
on public.categories for select to anon, authenticated
using (is_active = true or public.is_owner());

drop policy if exists "Owner manages categories" on public.categories;
create policy "Owner manages categories"
on public.categories for all to authenticated
using (public.is_owner()) with check (public.is_owner());

drop policy if exists "Public read active collections" on public.collections;
create policy "Public read active collections"
on public.collections for select to anon, authenticated
using (is_active = true or public.is_owner());

drop policy if exists "Owner manages collections" on public.collections;
create policy "Owner manages collections"
on public.collections for all to authenticated
using (public.is_owner()) with check (public.is_owner());

-- Published products are visible to everyone. Owners can also see drafts and archived items.
drop policy if exists "Public reads published products" on public.products;
create policy "Public reads published products"
on public.products for select to anon, authenticated
using (status = 'published' or public.is_owner());

drop policy if exists "Owner manages products" on public.products;
create policy "Owner manages products"
on public.products for all to authenticated
using (public.is_owner()) with check (public.is_owner() and created_by = (select auth.uid()));

-- Product images follow the visibility of their parent product.
drop policy if exists "Public reads images for visible products" on public.product_images;
create policy "Public reads images for visible products"
on public.product_images for select to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and (p.status = 'published' or public.is_owner())
  )
);

drop policy if exists "Owner manages product images" on public.product_images;
create policy "Owner manages product images"
on public.product_images for all to authenticated
using (public.is_owner())
with check (
  public.is_owner()
  and exists (select 1 from public.products p where p.id = product_id)
);

-- Storage bucket: public image delivery, authenticated owner-only writes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fashion-products',
  'fashion-products',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Public can view fashion product images" on storage.objects;
create policy "Public can view fashion product images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'fashion-products');

drop policy if exists "Owner uploads fashion product images" on storage.objects;
create policy "Owner uploads fashion product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'fashion-products' and public.is_owner());

drop policy if exists "Owner updates fashion product images" on storage.objects;
create policy "Owner updates fashion product images"
on storage.objects for update to authenticated
using (bucket_id = 'fashion-products' and public.is_owner())
with check (bucket_id = 'fashion-products' and public.is_owner());

drop policy if exists "Owner deletes fashion product images" on storage.objects;
create policy "Owner deletes fashion product images"
on storage.objects for delete to authenticated
using (bucket_id = 'fashion-products' and public.is_owner());

-- Bootstrap data. Edit category list as desired.
insert into public.categories (name, slug, description) values
('Ankara', 'ankara', 'Bold prints and contemporary Ankara styles'),
('Agbada', 'agbada', 'Traditional statement pieces'),
('Dresses', 'dresses', 'Elegant dresses for every occasion'),
('Ready to Wear', 'ready-to-wear', 'Easy-to-style everyday fashion'),
('Accessories', 'accessories', 'Finishing touches for your look')
on conflict (slug) do nothing;

-- IMPORTANT: After registering your own account, promote that account manually.
-- Find your user UUID in Authentication > Users, then run:
-- update public.profiles set role = 'owner' where id = 'YOUR_AUTH_USER_UUID';
-- Never expose the Supabase service-role key in the React app.
