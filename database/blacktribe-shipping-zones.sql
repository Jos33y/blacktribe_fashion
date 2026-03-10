-- ============================================================================
-- BLACKTRIBE LIFESTYLE — SHIPPING ZONES
-- Run AFTER blacktribe-schema.sql in the Supabase SQL Editor
-- ============================================================================
-- Model: State-level rates for Nigeria + international zones
-- Free shipping threshold is configurable per zone
-- ============================================================================


-- ═══════════════════════════════════════════════════════════════════════════
-- SHIPPING ZONES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

create table public.shipping_zones (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  zone_type             text not null check (zone_type in ('state', 'international')),
  state_code            text unique,
  rate                  integer not null check (rate >= 0),
  free_shipping_min     integer,
  estimated_days_min    integer not null default 3,
  estimated_days_max    integer not null default 5,
  is_active             boolean not null default true,
  sort_order            integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.shipping_zones is 'Shipping rates by Nigerian state and international zones. Rates in kobo.';
comment on column public.shipping_zones.rate is 'Shipping cost in kobo. 0 = always free.';
comment on column public.shipping_zones.free_shipping_min is 'Order minimum (kobo) for free shipping. NULL = free shipping disabled. 0 = always free.';
comment on column public.shipping_zones.state_code is 'Nigerian state name for state zones. NULL for international zones.';

-- Indexes
create index idx_shipping_zones_state on public.shipping_zones(state_code) where state_code is not null;
create index idx_shipping_zones_type on public.shipping_zones(zone_type);
create index idx_shipping_zones_active on public.shipping_zones(is_active);

-- Updated_at trigger
create trigger set_updated_at before update on public.shipping_zones
  for each row execute function public.update_updated_at();

-- RLS
alter table public.shipping_zones enable row level security;

-- Anyone can read active shipping zones (needed at checkout)
create policy "Anyone can read active shipping zones"
  on public.shipping_zones for select
  to anon, authenticated
  using (is_active = true);

-- Admins can manage shipping zones
create policy "Admins can manage shipping zones"
  on public.shipping_zones for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════
-- SEED: ALL 36 NIGERIAN STATES + FCT + INTERNATIONAL ZONES
-- ═══════════════════════════════════════════════════════════════════════════
-- Default rates (admin can adjust anytime):
--   Lagos:               ₦2,000 (200000 kobo)
--   South-West states:   ₦3,000 (300000 kobo)
--   South-South/East:    ₦3,500 (350000 kobo)
--   North-Central + FCT: ₦4,000 (400000 kobo)
--   North-West/East:     ₦4,500 (450000 kobo)
--   West Africa:         ₦12,000
--   Rest of Africa:      ₦18,000
--   Europe/Americas:     ₦25,000
--   Rest of World:       ₦30,000
--
-- FREE SHIPPING: Disabled by default (free_shipping_min = NULL).
--   Admin can enable per zone by setting a threshold in kobo.
--   Example: Set Lagos free_shipping_min to 5000000 = free over ₦50,000.
--   Set to 0 = always free for that zone.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.shipping_zones (name, zone_type, state_code, rate, free_shipping_min, estimated_days_min, estimated_days_max, sort_order) values

-- Lagos (home base)
('Lagos',             'state', 'Lagos',             200000,  null, 1, 3, 1),

-- South-West
('Ogun',              'state', 'Ogun',              300000,  null, 2, 4, 2),
('Oyo',               'state', 'Oyo',               300000,  null, 2, 4, 3),
('Osun',              'state', 'Osun',               300000,  null, 2, 4, 4),
('Ondo',              'state', 'Ondo',               300000,  null, 3, 5, 5),
('Ekiti',             'state', 'Ekiti',              300000,  null, 3, 5, 6),

-- South-South
('Rivers',            'state', 'Rivers',             350000,  null, 3, 5, 7),
('Delta',             'state', 'Delta',              350000,  null, 3, 5, 8),
('Edo',               'state', 'Edo',                350000,  null, 3, 5, 9),
('Bayelsa',           'state', 'Bayelsa',            350000,  null, 3, 6, 10),
('Akwa Ibom',         'state', 'Akwa Ibom',          350000,  null, 3, 6, 11),
('Cross River',       'state', 'Cross River',        350000,  null, 3, 6, 12),

-- South-East
('Anambra',           'state', 'Anambra',            350000,  null, 3, 5, 13),
('Enugu',             'state', 'Enugu',              350000,  null, 3, 5, 14),
('Imo',               'state', 'Imo',                350000,  null, 3, 5, 15),
('Abia',              'state', 'Abia',               350000,  null, 3, 6, 16),
('Ebonyi',            'state', 'Ebonyi',             350000,  null, 3, 6, 17),

-- North-Central + FCT
('FCT',               'state', 'FCT',                400000,  null, 3, 5, 18),
('Kwara',             'state', 'Kwara',              400000,  null, 3, 5, 19),
('Kogi',              'state', 'Kogi',               400000,  null, 3, 5, 20),
('Plateau',           'state', 'Plateau',            400000,  null, 3, 6, 21),
('Nasarawa',          'state', 'Nasarawa',           400000,  null, 3, 6, 22),
('Benue',             'state', 'Benue',              400000,  null, 3, 6, 23),
('Niger',             'state', 'Niger',              400000,  null, 3, 6, 24),

-- North-West
('Kaduna',            'state', 'Kaduna',             450000,  null, 4, 7, 25),
('Kano',              'state', 'Kano',               450000,  null, 4, 7, 26),
('Katsina',           'state', 'Katsina',            450000,  null, 4, 7, 27),
('Zamfara',           'state', 'Zamfara',            450000,  null, 4, 7, 28),
('Sokoto',            'state', 'Sokoto',             450000,  null, 4, 7, 29),
('Kebbi',             'state', 'Kebbi',              450000,  null, 4, 7, 30),
('Jigawa',            'state', 'Jigawa',             450000,  null, 4, 7, 31),

-- North-East
('Bauchi',            'state', 'Bauchi',             450000,  null, 4, 7, 32),
('Gombe',             'state', 'Gombe',              450000,  null, 4, 7, 33),
('Adamawa',           'state', 'Adamawa',            450000,  null, 5, 7, 34),
('Taraba',            'state', 'Taraba',             450000,  null, 5, 7, 35),
('Yobe',              'state', 'Yobe',               450000,  null, 5, 7, 36),
('Borno',             'state', 'Borno',              450000,  null, 5, 7, 37),

-- International zones
('West Africa',       'international', null,         1200000, null, 5,  10, 100),
('Rest of Africa',    'international', null,         1800000, null, 7,  14, 101),
('Europe and Americas','international', null,        2500000, null, 10, 14, 102),
('Rest of World',     'international', null,         3000000, null, 10, 21, 103);


-- ═══════════════════════════════════════════════════════════════════════════
-- DONE. 37 Nigerian states/FCT + 4 international zones seeded.
-- Free shipping is OFF by default. Admin enables it per zone by setting
-- free_shipping_min to a kobo value (e.g. 5000000 = free over ₦50,000).
-- Admin can adjust all rates, thresholds, and delivery estimates from the
-- dashboard without touching code.
-- ═══════════════════════════════════════════════════════════════════════════
