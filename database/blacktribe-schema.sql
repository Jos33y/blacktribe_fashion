-- ============================================================================
-- BLACKTRIBE LIFESTYLE — SUPABASE DATABASE SCHEMA
-- Run this entire file in the Supabase SQL Editor (one go)
-- ============================================================================
-- Tables: profiles, categories, collections, products, orders, order_items,
--         wishlist, discounts, newsletter, addresses
-- Plus: RLS policies, storage buckets, indexes, triggers
-- ============================================================================


-- ═══════════════════════════════════════════════════════════════════════════
-- 0. EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. PROFILES
-- ═══════════════════════════════════════════════════════════════════════════

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  role          text not null default 'customer' check (role in ('customer', 'admin')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'User profiles linked to Supabase Auth. Role determines admin access.';

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    now(),
    now()
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. CATEGORIES
-- ═══════════════════════════════════════════════════════════════════════════

create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  description   text,
  image_url     text,
  sort_order    integer not null default 0,
  is_active     boolean not null default true
);

comment on table public.categories is 'Product categories (Jackets, Tees, Shirts, etc.)';


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. COLLECTIONS
-- ═══════════════════════════════════════════════════════════════════════════

create table public.collections (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  description   text,
  image_url     text,
  season        text,
  is_active     boolean not null default true,
  start_date    date,
  end_date      date,
  created_at    timestamptz not null default now()
);

comment on table public.collections is 'Product collections / drops (Shadow Collection, Noir Essentials, etc.)';


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. PRODUCTS
-- ═══════════════════════════════════════════════════════════════════════════

create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text unique not null,
  description         text,
  short_description   text,
  price               integer not null check (price > 0),
  compare_at_price    integer check (compare_at_price is null or compare_at_price > 0),
  category_id         uuid references public.categories(id) on delete set null,
  collection_id       uuid references public.collections(id) on delete set null,
  images              jsonb not null default '[]'::jsonb,
  sizes               jsonb not null default '[]'::jsonb,
  colors              jsonb default '[]'::jsonb,
  tags                text[] default '{}',
  badge               text check (badge is null or badge in ('NEW', 'PRE-ORDER', 'LIMITED', 'SOLD OUT')),
  video_url           text,
  is_featured         boolean not null default false,
  is_active           boolean not null default true,
  show_inventory      boolean not null default false,
  total_inventory     integer,
  preorder_deadline   timestamptz,
  sku                 text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.products is 'All products. Prices in kobo (₦185,000 = 18500000). Scarcity toggleable per product.';
comment on column public.products.price is 'Price in kobo. ₦1 = 100 kobo.';
comment on column public.products.images is 'Ordered array of image URLs: ["url1", "url2", ...]';
comment on column public.products.sizes is 'Array of {size, stock} objects: [{"size": "M", "stock": 10}, ...]';
comment on column public.products.colors is 'Array of {name, hex} objects: [{"name": "Obsidian", "hex": "#0C0C0C"}, ...]';


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. ORDERS
-- ═══════════════════════════════════════════════════════════════════════════

create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text unique not null,
  user_id             uuid references auth.users(id) on delete set null,
  guest_email         text,
  status              text not null default 'pending'
                        check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal            integer not null check (subtotal >= 0),
  shipping_cost       integer not null default 0 check (shipping_cost >= 0),
  discount_amount     integer not null default 0 check (discount_amount >= 0),
  total               integer not null check (total >= 0),
  shipping_address    jsonb not null,
  payment_reference   text,
  payment_status      text not null default 'pending'
                        check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  tracking_number     text,
  tracking_token      text unique not null default encode(gen_random_bytes(32), 'hex'),
  discount_code       text,
  shipped_at          timestamptz,
  delivered_at        timestamptz,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.orders is 'All orders. Supports both authenticated and guest checkout. Amounts in kobo.';
comment on column public.orders.tracking_token is 'Random token for guest order tracking URLs. No login required.';


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. ORDER ITEMS
-- ═══════════════════════════════════════════════════════════════════════════

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  name          text not null,
  price         integer not null check (price > 0),
  quantity      integer not null check (quantity > 0),
  size          text not null,
  color         text,
  image_url     text not null
);

comment on table public.order_items is 'Snapshot of products at time of purchase. Prices in kobo.';


-- ═══════════════════════════════════════════════════════════════════════════
-- 7. WISHLIST
-- ═══════════════════════════════════════════════════════════════════════════

create table public.wishlist (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  product_id    uuid not null references public.products(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (user_id, product_id)
);

comment on table public.wishlist is 'User wishlists. Requires authentication.';


-- ═══════════════════════════════════════════════════════════════════════════
-- 8. DISCOUNTS
-- ═══════════════════════════════════════════════════════════════════════════

create table public.discounts (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  type          text not null check (type in ('percentage', 'fixed')),
  value         integer not null check (value > 0),
  min_order     integer,
  usage_limit   integer,
  times_used    integer not null default 0,
  is_active     boolean not null default true,
  starts_at     timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);

comment on table public.discounts is 'Discount codes. Value is percentage (15 = 15%) or fixed amount in kobo.';


-- ═══════════════════════════════════════════════════════════════════════════
-- 9. NEWSLETTER
-- ═══════════════════════════════════════════════════════════════════════════

create table public.newsletter (
  id              uuid primary key default gen_random_uuid(),
  email           text unique not null,
  is_active       boolean not null default true,
  subscribed_at   timestamptz not null default now()
);

comment on table public.newsletter is 'Newsletter subscribers. No auth required to subscribe.';


-- ═══════════════════════════════════════════════════════════════════════════
-- 10. ADDRESSES
-- ═══════════════════════════════════════════════════════════════════════════

create table public.addresses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  label         text,
  full_name     text not null,
  street        text not null,
  city          text not null,
  state         text not null,
  lga           text,
  phone         text,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now()
);

comment on table public.addresses is 'Saved shipping addresses for authenticated users.';


-- ═══════════════════════════════════════════════════════════════════════════
-- 11. UPDATED_AT TRIGGER FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply to all tables with updated_at
create trigger set_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.products
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.orders
  for each row execute function public.update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- 12. INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

-- Products
create index idx_products_slug on public.products(slug);
create index idx_products_category on public.products(category_id) where is_active = true;
create index idx_products_collection on public.products(collection_id) where is_active = true;
create index idx_products_featured on public.products(is_featured) where is_active = true and is_featured = true;
create index idx_products_active on public.products(is_active, created_at desc);
create index idx_products_badge on public.products(badge) where badge is not null;

-- Categories
create index idx_categories_slug on public.categories(slug);
create index idx_categories_active on public.categories(is_active, sort_order);

-- Collections
create index idx_collections_slug on public.collections(slug);
create index idx_collections_active on public.collections(is_active);

-- Orders
create index idx_orders_user on public.orders(user_id) where user_id is not null;
create index idx_orders_status on public.orders(status);
create index idx_orders_order_number on public.orders(order_number);
create index idx_orders_tracking_token on public.orders(tracking_token);
create index idx_orders_guest_email on public.orders(guest_email) where guest_email is not null;
create index idx_orders_created on public.orders(created_at desc);

-- Order Items
create index idx_order_items_order on public.order_items(order_id);
create index idx_order_items_product on public.order_items(product_id);

-- Wishlist
create index idx_wishlist_user on public.wishlist(user_id);
create index idx_wishlist_product on public.wishlist(product_id);

-- Addresses
create index idx_addresses_user on public.addresses(user_id);

-- Newsletter
create index idx_newsletter_email on public.newsletter(email);

-- Discounts
create index idx_discounts_code on public.discounts(code);


-- ═══════════════════════════════════════════════════════════════════════════
-- 13. ORDER NUMBER SEQUENCE
-- ═══════════════════════════════════════════════════════════════════════════
-- Format: BT-YYYYNNNN (e.g. BT-20260001)
-- We use a sequence scoped per year. The server generates order numbers,
-- but this helper function is available for direct DB use.

create sequence if not exists public.order_number_seq start with 1 increment by 1;

create or replace function public.generate_order_number()
returns text
language plpgsql
as $$
declare
  seq_val integer;
  year_part text;
begin
  seq_val := nextval('public.order_number_seq');
  year_part := to_char(now(), 'YYYY');
  return 'BT-' || year_part || lpad(seq_val::text, 4, '0');
end;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 14. ENSURE SINGLE DEFAULT ADDRESS PER USER
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.ensure_single_default_address()
returns trigger
language plpgsql
as $$
begin
  if new.is_default = true then
    update public.addresses
    set is_default = false
    where user_id = new.user_id
      and id != new.id
      and is_default = true;
  end if;
  return new;
end;
$$;

create trigger enforce_single_default_address
  before insert or update on public.addresses
  for each row execute function public.ensure_single_default_address();


-- ═══════════════════════════════════════════════════════════════════════════
-- 15. ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.wishlist enable row level security;
alter table public.discounts enable row level security;
alter table public.newsletter enable row level security;
alter table public.addresses enable row level security;


-- ─── PROFILES ───

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Users can update their own profile (but not role)
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'customer');

-- Admins can read all profiles
create policy "Admins can read all profiles"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update all profiles
create policy "Admins can update all profiles"
  on public.profiles for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─── CATEGORIES (public read) ───

create policy "Anyone can read active categories"
  on public.categories for select
  to anon, authenticated
  using (is_active = true);

create policy "Admins can manage categories"
  on public.categories for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─── COLLECTIONS (public read) ───

create policy "Anyone can read active collections"
  on public.collections for select
  to anon, authenticated
  using (is_active = true);

create policy "Admins can manage collections"
  on public.collections for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─── PRODUCTS (public read) ───

create policy "Anyone can read active products"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

-- Admins can read ALL products (including inactive)
create policy "Admins can read all products"
  on public.products for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert products"
  on public.products for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update products"
  on public.products for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─── ORDERS ───

-- Users can read their own orders
create policy "Users can read own orders"
  on public.orders for select
  to authenticated
  using (user_id = auth.uid());

-- Guest order tracking via tracking_token (handled by service role in API)
-- No anon policy needed — the Express server uses service role key for guest tracking

-- Admins can read all orders
create policy "Admins can read all orders"
  on public.orders for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update orders (status, tracking, notes)
create policy "Admins can update orders"
  on public.orders for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Order creation happens via service role (server-side) so no insert policy for anon/authenticated needed
-- The Express server uses the service role key to create orders


-- ─── ORDER ITEMS ───

-- Users can read items for their own orders
create policy "Users can read own order items"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

-- Admins can read all order items
create policy "Admins can read all order items"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─── WISHLIST ───

create policy "Users can read own wishlist"
  on public.wishlist for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can add to own wishlist"
  on public.wishlist for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can remove from own wishlist"
  on public.wishlist for delete
  to authenticated
  using (user_id = auth.uid());


-- ─── DISCOUNTS ───

-- Public can validate discount codes (read active ones)
create policy "Anyone can read active discounts"
  on public.discounts for select
  to anon, authenticated
  using (is_active = true);

-- Admins can manage discounts
create policy "Admins can manage discounts"
  on public.discounts for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─── NEWSLETTER ───

-- Anyone can subscribe (insert)
create policy "Anyone can subscribe to newsletter"
  on public.newsletter for insert
  to anon, authenticated
  with check (true);

-- Admins can read all subscribers
create policy "Admins can read newsletter"
  on public.newsletter for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can manage newsletter
create policy "Admins can manage newsletter"
  on public.newsletter for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─── ADDRESSES ───

create policy "Users can read own addresses"
  on public.addresses for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own addresses"
  on public.addresses for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own addresses"
  on public.addresses for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own addresses"
  on public.addresses for delete
  to authenticated
  using (user_id = auth.uid());

-- Admins can read all addresses (for order management)
create policy "Admins can read all addresses"
  on public.addresses for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════
-- 16. STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════════════

-- Products bucket (product images)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products',
  'products',
  true,
  5242880,  -- 5MB max
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
);

-- Collections bucket (collection hero images)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'collections',
  'collections',
  true,
  5242880,  -- 5MB max
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
);


-- ─── STORAGE RLS POLICIES ───

-- Anyone can view product images (public bucket)
create policy "Public read access on products bucket"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'products');

-- Anyone can view collection images (public bucket)
create policy "Public read access on collections bucket"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'collections');

-- Admins can upload product images
create policy "Admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'products'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update product images
create policy "Admins can update product images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'products'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can delete product images
create policy "Admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'products'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can upload collection images
create policy "Admins can upload collection images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'collections'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update collection images
create policy "Admins can update collection images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'collections'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can delete collection images
create policy "Admins can delete collection images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'collections'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════
-- 17. HELPER: MAKE A USER AN ADMIN
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this AFTER a user has signed up to promote them to admin:
--
--   update public.profiles
--   set role = 'admin'
--   where id = '<USER_UUID_HERE>';
--
-- You can find the user UUID in the Supabase Auth > Users dashboard.
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
-- DONE. All tables, policies, storage, indexes, and triggers are in place.
-- ═══════════════════════════════════════════════════════════════════════════
