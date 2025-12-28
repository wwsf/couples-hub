-- Migration: Create Bills and Grocery tables
-- Created: 2025-12-28

-- ============================================================================
-- 1. CREATE BILLS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couple_relationships(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,

  -- Bill Details
  name TEXT NOT NULL,
  bill_type TEXT NOT NULL CHECK (bill_type IN ('electricity', 'water', 'gas', 'internet', 'rent', 'phone', 'insurance', 'subscription', 'other')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Scheduling
  due_date DATE NOT NULL,
  recurring BOOLEAN DEFAULT false,
  recurrence_period TEXT CHECK (recurrence_period IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),

  -- Assignment & Payment
  assigned_to UUID REFERENCES auth.users(id), -- null means shared/both
  split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom', 'single')),
  partner_a_amount DECIMAL(10, 2), -- for custom split
  partner_b_amount DECIMAL(10, 2), -- for custom split

  -- Status
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  paid_date TIMESTAMP WITH TIME ZONE,
  paid_by UUID REFERENCES auth.users(id),

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Bills
CREATE INDEX IF NOT EXISTS idx_bills_couple_id ON bills(couple_id);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON bills(payment_status);
CREATE INDEX IF NOT EXISTS idx_bills_assigned_to ON bills(assigned_to);

-- ============================================================================
-- 2. CREATE GROCERY ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couple_relationships(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,

  -- Item Details
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN ('produce', 'dairy', 'meat', 'pantry', 'frozen', 'beverages', 'snacks', 'household', 'other')),
  quantity TEXT, -- e.g., "2", "1 lb", "3 cans"
  notes TEXT,

  -- Status
  checked BOOLEAN DEFAULT false,
  checked_by UUID REFERENCES auth.users(id),
  checked_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Grocery Items
CREATE INDEX IF NOT EXISTS idx_grocery_items_couple_id ON grocery_items(couple_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_checked ON grocery_items(checked);
CREATE INDEX IF NOT EXISTS idx_grocery_items_category ON grocery_items(category);

-- ============================================================================
-- 3. ROW LEVEL SECURITY POLICIES FOR BILLS
-- ============================================================================

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couples can view their bills"
  ON bills FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
  );

CREATE POLICY "Couples can insert bills"
  ON bills FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Couples can update their bills"
  ON bills FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
  );

CREATE POLICY "Couples can delete their bills"
  ON bills FOR DELETE
  USING (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
  );

-- ============================================================================
-- 4. ROW LEVEL SECURITY POLICIES FOR GROCERY ITEMS
-- ============================================================================

ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couples can view their grocery items"
  ON grocery_items FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
  );

CREATE POLICY "Couples can insert grocery items"
  ON grocery_items FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Couples can update their grocery items"
  ON grocery_items FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
  );

CREATE POLICY "Couples can delete their grocery items"
  ON grocery_items FOR DELETE
  USING (
    couple_id IN (
      SELECT id FROM couple_relationships
      WHERE (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
        AND status = 'active'
    )
  );

-- ============================================================================
-- 5. CREATE TRIGGER FUNCTIONS FOR UPDATED_AT
-- ============================================================================

-- Create function if it doesn't exist (reusable for all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grocery_items_updated_at
  BEFORE UPDATE ON grocery_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. ENABLE REALTIME FOR NEW TABLES
-- ============================================================================

-- Note: You'll need to enable Realtime in Supabase Dashboard:
-- Database > Replication > supabase_realtime Publication
-- Add tables: bills, grocery_items

-- ============================================================================
-- Migration Complete!
-- ============================================================================

-- To apply this migration:
-- 1. Copy this SQL
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Paste and run
-- 4. Enable Realtime for both tables in Database > Replication
