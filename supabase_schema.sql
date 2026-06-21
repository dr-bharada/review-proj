-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. TABLES DEFINITIONS
-- ==========================================

-- Table: businesses
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  category text,
  phone_number text,
  address text,
  logo_url text,
  subscription_plan text not null default 'starter',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: review_links
create table public.review_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  platform_name text not null,
  platform_url text not null,
  is_enabled boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: qr_codes
create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  slug text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: analytics_events
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  platform_name text, -- NULL for general page views/scans, text for clicks (e.g. 'Google', 'Zomato')
  event_type text not null, -- 'scan' or 'click'
  user_agent text,
  ip_hash text, -- Hashed IP for basic uniqueness without storing PII
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 2. INDEXES
-- ==========================================
create index if not exists idx_businesses_owner on public.businesses(owner_id);
create index if not exists idx_review_links_business on public.review_links(business_id);
create index if not exists idx_qr_codes_business on public.qr_codes(business_id);
create index if not exists idx_qr_codes_slug on public.qr_codes(slug);
create index if not exists idx_analytics_business on public.analytics_events(business_id);

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
alter table public.businesses enable row level security;
alter table public.review_links enable row level security;
alter table public.qr_codes enable row level security;
alter table public.analytics_events enable row level security;

-- --- BUSINESSES POLICIES ---

-- Allow public users to view profiles (to render the public review page)
create policy "Allow public read access to businesses"
  on public.businesses for select
  using (true);

-- Allow owners full control of their business profiles
create policy "Allow owners full control of their businesses"
  on public.businesses for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- --- REVIEW LINKS POLICIES ---

-- Allow public users to view active review links
create policy "Allow public read access to active review links"
  on public.review_links for select
  using (is_enabled = true);

-- Allow owners full control of their review links
create policy "Allow owners full control of their review links"
  on public.review_links for all
  using (
    exists (
      select 1 from public.businesses
      where public.businesses.id = review_links.business_id
      and public.businesses.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses
      where public.businesses.id = review_links.business_id
      and public.businesses.owner_id = auth.uid()
    )
  );

-- --- QR CODES POLICIES ---

-- Allow public users to read QR codes (to redirect from slug to business ID)
create policy "Allow public read access to QR codes"
  on public.qr_codes for select
  using (true);

-- Allow owners full control of their QR codes
create policy "Allow owners full control of their QR codes"
  on public.qr_codes for all
  using (
    exists (
      select 1 from public.businesses
      where public.businesses.id = qr_codes.business_id
      and public.businesses.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses
      where public.businesses.id = qr_codes.business_id
      and public.businesses.owner_id = auth.uid()
    )
  );

-- --- ANALYTICS EVENTS POLICIES ---

-- Allow anyone (public/anonymous) to log page view / click events
create policy "Allow public insert to analytics events"
  on public.analytics_events for insert
  with check (true);

-- Allow only owners to read analytics events for their business
create policy "Allow owners read access to their analytics"
  on public.analytics_events for select
  using (
    exists (
      select 1 from public.businesses
      where public.businesses.id = analytics_events.business_id
      and public.businesses.owner_id = auth.uid()
    )
  );
