# Supabase Setup Instructions

## Step 1: Run this SQL in your Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the ENTIRE SQL script below
5. Paste it into the editor
6. Click "Run" to execute

---

## SQL Script to Run:

```sql
-- =====================================================
-- Couples Hub Database Schema
-- Migration 001: Create all tables
-- =====================================================

-- Create profiles table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create couple_relationships table
CREATE TABLE IF NOT EXISTS couple_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_a_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  partner_b_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invitation_token TEXT UNIQUE,
  invitation_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_partners CHECK (partner_a_id != partner_b_id OR partner_b_id IS NULL),
  UNIQUE(partner_a_id, partner_b_id)
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  couple_id UUID REFERENCES couple_relationships(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  location TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  color TEXT DEFAULT 'blue',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id BIGSERIAL PRIMARY KEY,
  couple_id UUID REFERENCES couple_relationships(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category TEXT DEFAULT 'general',
  due_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_couple_id ON events(couple_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_todos_couple_id ON todos(couple_id);
CREATE INDEX IF NOT EXISTS idx_todos_assigned_to ON todos(assigned_to);
CREATE INDEX IF NOT EXISTS idx_couple_relationships_partner_a ON couple_relationships(partner_a_id);
CREATE INDEX IF NOT EXISTS idx_couple_relationships_partner_b ON couple_relationships(partner_b_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view partner profile" ON profiles;
CREATE POLICY "Users can view partner profile"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT CASE
        WHEN partner_a_id = auth.uid() THEN partner_b_id
        WHEN partner_b_id = auth.uid() THEN partner_a_id
      END
      FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for couple_relationships
DROP POLICY IF EXISTS "Users can view own couple relationship" ON couple_relationships;
CREATE POLICY "Users can view own couple relationship"
  ON couple_relationships FOR SELECT
  USING (partner_a_id = auth.uid() OR partner_b_id = auth.uid());

DROP POLICY IF EXISTS "Users can create couple relationship" ON couple_relationships;
CREATE POLICY "Users can create couple relationship"
  ON couple_relationships FOR INSERT
  WITH CHECK (
    partner_a_id = auth.uid() OR
    (partner_b_id = auth.uid() AND partner_a_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Users can update own couple relationship" ON couple_relationships;
CREATE POLICY "Users can update own couple relationship"
  ON couple_relationships FOR UPDATE
  USING (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
  WITH CHECK (partner_a_id = auth.uid() OR partner_b_id = auth.uid());

-- RLS Policies for events
DROP POLICY IF EXISTS "Couples can view their events" ON events;
CREATE POLICY "Couples can view their events"
  ON events FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Couples can insert events" ON events;
CREATE POLICY "Couples can insert events"
  ON events FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Couples can update their events" ON events;
CREATE POLICY "Couples can update their events"
  ON events FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Couples can delete their events" ON events;
CREATE POLICY "Couples can delete their events"
  ON events FOR DELETE
  USING (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
  );

-- RLS Policies for todos
DROP POLICY IF EXISTS "Couples can view their todos" ON todos;
CREATE POLICY "Couples can view their todos"
  ON todos FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Couples can insert todos" ON todos;
CREATE POLICY "Couples can insert todos"
  ON todos FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Couples can update their todos" ON todos;
CREATE POLICY "Couples can update their todos"
  ON todos FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Couples can delete their todos" ON todos;
CREATE POLICY "Couples can delete their todos"
  ON todos FOR DELETE
  USING (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_couple_relationships_updated_at ON couple_relationships;
CREATE TRIGGER update_couple_relationships_updated_at BEFORE UPDATE ON couple_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Step 2: Test Your Setup

After running the SQL, you should see:
- New tables: `profiles`, `couple_relationships`
- Updated tables: `events` and `todos` with new columns
- RLS policies enabled and working

## Step 3: Test the App

1. Your dev server should be running at `http://localhost:5173`
2. You'll be redirected to the login page
3. Sign up with your email
4. After signing up, you can invite your partner
5. Your partner uses the invitation link to join

That's it! The authentication system is now ready to use! 🎉
