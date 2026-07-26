-- FlowBite SaaS Platform - Supabase PostgreSQL Database Schema
-- Run this script in your Supabase SQL Editor to initialize tables, RLS policies, and Realtime publications.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  address TEXT NOT NULL,
  active_tables_count INT DEFAULT 12,
  open_hours TEXT DEFAULT '11:00 AM - 10:00 PM',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Profiles with Role-Based Access Control (RBAC)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'kitchen', 'staff', 'manager')),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ingredients / Inventory Table
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  min_threshold NUMERIC NOT NULL DEFAULT 10,
  cost_per_unit NUMERIC NOT NULL DEFAULT 0.00,
  supplier TEXT NOT NULL,
  last_restocked TIMESTAMPTZ DEFAULT NOW(),
  category TEXT NOT NULL CHECK (category IN ('Produce', 'Protein', 'Dairy', 'Pantry', 'Beverage')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Menu Items Table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Appetizers', 'Mains', 'Desserts', 'Drinks', 'Sides')),
  price NUMERIC NOT NULL,
  description TEXT,
  image_url TEXT,
  prep_station TEXT NOT NULL CHECK (prep_station IN ('Grill', 'Sauté', 'Fry', 'Pantry/Cold', 'Bar', 'Bakery')),
  prep_time_minutes INT DEFAULT 15,
  recipe JSONB DEFAULT '[]'::jsonb,
  is_available BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  dietary_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dine-in', 'pickup', 'qr-table')),
  table_number INT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'preparing', 'cooking', 'ready', 'served', 'completed', 'cancelled')),
  estimated_prep_time_minutes INT DEFAULT 20,
  notes TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Dining Tables Floor Plan
CREATE TABLE IF NOT EXISTS public.dining_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  table_number INT NOT NULL,
  capacity INT NOT NULL,
  zone TEXT NOT NULL CHECK (zone IN ('Main Dining', 'Patio', 'Bar Area', 'Private Room')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'seated', 'ordered', 'food_ready', 'payment_due', 'cleaning')),
  current_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  seated_at TIMESTAMPTZ,
  assigned_staff TEXT,
  guest_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Waitlist Queue Entries
CREATE TABLE IF NOT EXISTS public.queue_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  party_size INT NOT NULL DEFAULT 2,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  estimated_wait_minutes INT DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'seated', 'cancelled')),
  seating_preference TEXT DEFAULT 'First Available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AI Operational Insights
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bottleneck', 'inventory_alert', 'demand_forecast', 'staffing_advice')),
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  impact_metric TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Allow public read access to Menu, Dining Tables, Queue
CREATE POLICY "Public Menu Read" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Public Tables Read" ON public.dining_tables FOR SELECT USING (true);
CREATE POLICY "Public Queue Read" ON public.queue_entries FOR SELECT USING (true);
CREATE POLICY "Public Order Create" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Order Read" ON public.orders FOR SELECT USING (true);

-- Allow authenticated kitchen/staff/manager users full write access
CREATE POLICY "Staff Full Access Orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Staff Full Access Menu" ON public.menu_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Staff Full Access Ingredients" ON public.ingredients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Staff Full Access Tables" ON public.dining_tables FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Staff Full Access Queue" ON public.queue_entries FOR ALL USING (auth.role() = 'authenticated');

-- ===================================
-- SUPABASE REALTIME PUBLICATION
-- ===================================
-- Enable Supabase Realtime for instant live sync across client screens
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ingredients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dining_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_insights;
