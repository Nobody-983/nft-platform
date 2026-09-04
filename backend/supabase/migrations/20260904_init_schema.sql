-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  wallet_address text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- =====================================================
-- NFTS TABLE
-- =====================================================
create table if not exists public.nfts (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  image_url text not null,
  category text not null,
  price numeric not null default 0,
  currency text not null default 'NIM',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.nfts enable row level security;

create policy "NFTs are viewable by everyone"
  on public.nfts for select
  using (true);

create policy "Users can create their own NFTs"
  on public.nfts for insert
  with check (auth.uid() = creator_id);

create policy "Users can delete their own NFTs"
  on public.nfts for delete
  using (auth.uid() = creator_id);

-- =====================================================
-- MARKETPLACE LISTINGS TABLE
-- =====================================================
create table if not exists public.marketplace_listings (
  id uuid default gen_random_uuid() primary key,
  nft_id uuid references public.nfts(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  price numeric not null,
  currency text not null default 'NIM',
  status text not null default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.marketplace_listings enable row level security;

create policy "Listings are viewable by everyone"
  on public.marketplace_listings for select
  using (true);

create policy "Sellers can create listings"
  on public.marketplace_listings for insert
  with check (auth.uid() = seller_id);

create policy "Sellers can update their own listings"
  on public.marketplace_listings for update
  using (auth.uid() = seller_id);

-- =====================================================
-- NFT LIKES TABLE
-- =====================================================
create table if not exists public.nft_likes (
  id uuid default gen_random_uuid() primary key,
  nft_id uuid references public.nfts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(nft_id, user_id)
);

alter table public.nft_likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.nft_likes for select
  using (true);

create policy "Users can manage their own likes"
  on public.nft_likes for all
  using (auth.uid() = user_id);
