-- ============================================================================
-- BLACKTRIBE LIFESTYLE — ADMIN ROLES + PERMISSIONS
-- Run AFTER blacktribe-schema.sql and blacktribe-shipping-zones.sql
-- ============================================================================
-- Adds superadmin role and granular permissions for admin users.
--
-- ROLES:
--   customer    — default, regular shopper
--   admin       — staff with specific permissions only
--   superadmin  — full access, can manage other admins
--
-- PERMISSIONS (stored as jsonb array on admin profiles):
--   products    — create, edit, deactivate products
--   orders      — view, update status, add tracking
--   customers   — view customer list and order history
--   collections — create, edit collections
--   discounts   — create, edit discount codes
--   shipping    — manage shipping zones and rates
--   settings    — site settings, email templates
-- ============================================================================


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. UPDATE PROFILES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop existing role check constraint
alter table public.profiles
  drop constraint if exists profiles_role_check;

-- Add new constraint with superadmin
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('customer', 'admin', 'superadmin'));

-- Add permissions column (only used for admin role, ignored for superadmin/customer)
alter table public.profiles
  add column if not exists permissions jsonb not null default '[]'::jsonb;

comment on column public.profiles.permissions is 'Granular permissions for admin role. Superadmin has all permissions implicitly. Array of strings: ["products", "orders", "customers", "collections", "discounts", "shipping", "settings"]';


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Check if current user is superadmin
create or replace function public.is_superadmin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'superadmin'
  );
$$;

-- Check if current user is any admin type (admin or superadmin)
create or replace function public.is_any_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'superadmin')
  );
$$;

-- Check if current user has a specific permission
-- Superadmin always returns true. Admin checks permissions array.
create or replace function public.has_permission(required_permission text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (
        role = 'superadmin'
        or (role = 'admin' and permissions ? required_permission)
      )
  );
$$;

comment on function public.has_permission is 'Check if user has a specific permission. Superadmin always passes. Admin checks permissions jsonb array.';


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. UPDATE RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════
-- Replace all "role = 'admin'" checks with the new helper functions.
-- Superadmin gets everything. Admin gets permission-specific access.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── PROFILES ───

-- Drop old admin policies
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

-- Admins can read all profiles (for customer management)
create policy "Admins can read all profiles"
  on public.profiles for select
  to authenticated
  using (public.has_permission('customers'));

-- Only superadmin can update profiles (role changes, permission assignments)
create policy "Superadmins can update all profiles"
  on public.profiles for update
  to authenticated
  using (public.is_superadmin());

-- Update the user's own profile policy to prevent role AND permissions self-edit
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.profiles where id = auth.uid())
    and permissions = (select permissions from public.profiles where id = auth.uid())
  );


-- ─── CATEGORIES ───

drop policy if exists "Admins can manage categories" on public.categories;

create policy "Admins can manage categories"
  on public.categories for all
  to authenticated
  using (public.has_permission('collections'));


-- ─── COLLECTIONS ───

drop policy if exists "Admins can manage collections" on public.collections;

create policy "Admins can manage collections"
  on public.collections for all
  to authenticated
  using (public.has_permission('collections'));


-- ─── PRODUCTS ───

drop policy if exists "Admins can read all products" on public.products;
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;

create policy "Admins can read all products"
  on public.products for select
  to authenticated
  using (public.has_permission('products'));

create policy "Admins can insert products"
  on public.products for insert
  to authenticated
  with check (public.has_permission('products'));

create policy "Admins can update products"
  on public.products for update
  to authenticated
  using (public.has_permission('products'));

create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using (public.has_permission('products'));


-- ─── ORDERS ───

drop policy if exists "Admins can read all orders" on public.orders;
drop policy if exists "Admins can update orders" on public.orders;

create policy "Admins can read all orders"
  on public.orders for select
  to authenticated
  using (public.has_permission('orders'));

create policy "Admins can update orders"
  on public.orders for update
  to authenticated
  using (public.has_permission('orders'));


-- ─── ORDER ITEMS ───

drop policy if exists "Admins can read all order items" on public.order_items;

create policy "Admins can read all order items"
  on public.order_items for select
  to authenticated
  using (public.has_permission('orders'));


-- ─── DISCOUNTS ───

drop policy if exists "Admins can manage discounts" on public.discounts;

create policy "Admins can manage discounts"
  on public.discounts for all
  to authenticated
  using (public.has_permission('discounts'));


-- ─── NEWSLETTER ───

drop policy if exists "Admins can read newsletter" on public.newsletter;
drop policy if exists "Admins can manage newsletter" on public.newsletter;

create policy "Admins can read newsletter"
  on public.newsletter for select
  to authenticated
  using (public.is_any_admin());

create policy "Admins can manage newsletter"
  on public.newsletter for all
  to authenticated
  using (public.is_any_admin());


-- ─── ADDRESSES ───

drop policy if exists "Admins can read all addresses" on public.addresses;

create policy "Admins can read all addresses"
  on public.addresses for select
  to authenticated
  using (public.has_permission('orders'));


-- ─── SHIPPING ZONES ───

drop policy if exists "Admins can manage shipping zones" on public.shipping_zones;

create policy "Admins can manage shipping zones"
  on public.shipping_zones for all
  to authenticated
  using (public.has_permission('shipping'));


-- ─── STORAGE (products bucket) ───

drop policy if exists "Admins can upload product images" on storage.objects;
drop policy if exists "Admins can update product images" on storage.objects;
drop policy if exists "Admins can delete product images" on storage.objects;

create policy "Admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'products'
    and public.has_permission('products')
  );

create policy "Admins can update product images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'products'
    and public.has_permission('products')
  );

create policy "Admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'products'
    and public.has_permission('products')
  );


-- ─── STORAGE (collections bucket) ───

drop policy if exists "Admins can upload collection images" on storage.objects;
drop policy if exists "Admins can update collection images" on storage.objects;
drop policy if exists "Admins can delete collection images" on storage.objects;

create policy "Admins can upload collection images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'collections'
    and public.has_permission('collections')
  );

create policy "Admins can update collection images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'collections'
    and public.has_permission('collections')
  );

create policy "Admins can delete collection images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'collections'
    and public.has_permission('collections')
  );


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. PROMOTE YOUR ACCOUNT TO SUPERADMIN
-- ═══════════════════════════════════════════════════════════════════════════
-- After signing up, run:
--
--   update public.profiles
--   set role = 'superadmin',
--       permissions = '["products","orders","customers","collections","discounts","shipping","settings"]'::jsonb
--   where id = '<YOUR_USER_UUID>';
--
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. EXAMPLE: CREATE A LIMITED ADMIN (orders + products only)
-- ═══════════════════════════════════════════════════════════════════════════
-- After the staff member signs up, run:
--
--   update public.profiles
--   set role = 'admin',
--       permissions = '["products","orders"]'::jsonb
--   where id = '<STAFF_USER_UUID>';
--
-- They can manage products and orders, but cannot touch discounts,
-- collections, shipping, customers, or settings.
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
-- DONE. Three-tier role system in place:
--   superadmin → all permissions, can manage staff
--   admin      → only assigned permissions
--   customer   → default, no admin access
-- ═══════════════════════════════════════════════════════════════════════════
