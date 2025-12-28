# Database Setup for Bills & Grocery Features

## Step 1: Run the Migration

You need to run the SQL migration to create the `bills` and `grocery_items` tables in your Supabase database.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/002_create_bills_and_grocery.sql`
5. Paste into the query editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see success messages for all the CREATE statements

### Option B: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Run all pending migrations
supabase db push
```

## Step 2: Enable Realtime for New Tables

After running the migration, enable Realtime subscriptions:

1. Go to **Database** → **Replication** in your Supabase dashboard
2. Find the **supabase_realtime** publication
3. Click to expand it
4. Make sure these tables are enabled:
   - ✅ `bills`
   - ✅ `grocery_items`
5. If they're not enabled, click **Edit** and check both tables

## Step 3: Verify Tables Were Created

Run this query in SQL Editor to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('bills', 'grocery_items');
```

You should see both tables listed.

## Step 4: Test in the App

1. Refresh your browser
2. Navigate to the **🛒 Groceries** tab
3. Try adding a grocery item
4. Navigate to the **💳 Bills** tab
5. Try adding a bill

Both features should now work with real-time sync between partners!

## Troubleshooting

### "relation does not exist" error
- The migration hasn't been run yet. Go back to Step 1.

### Items not syncing in real-time
- Make sure Realtime is enabled for both tables (Step 2)
- Check browser console for subscription errors

### Permission denied errors
- The RLS policies should have been created by the migration
- Verify you have an active couple relationship
- Check that you're signed in

## What Was Created

### Bills Table
Tracks utility bills with:
- Bill name, type (electricity, water, etc.)
- Amount and due date
- Recurring billing support
- Payment status tracking
- Split options between partners

### Grocery Items Table
Shared shopping list with:
- Item name and category
- Quantity
- Checked/unchecked status
- Real-time collaboration

Both tables are protected by Row Level Security (RLS) and only accessible to couples in active relationships.
