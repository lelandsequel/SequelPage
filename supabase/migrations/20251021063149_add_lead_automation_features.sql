/*
  # Lead Automation and Management Features

  1. New Tables
    - `lead_tags` - Custom tags for lead categorization
      - `id` (uuid, primary key)
      - `name` (text, unique) - Tag name
      - `color` (text) - Display color
      - `created_at` (timestamptz)
    
    - `lead_tag_assignments` - Junction table for lead-tag relationships
      - `id` (uuid, primary key)
      - `lead_id` (uuid, foreign key to leads)
      - `tag_id` (uuid, foreign key to lead_tags)
      - `created_at` (timestamptz)
    
    - `lead_notes` - Notes and interactions with leads
      - `id` (uuid, primary key)
      - `lead_id` (uuid, foreign key to leads)
      - `note` (text) - Note content
      - `note_type` (text) - 'call', 'email', 'meeting', 'general'
      - `created_by` (text) - User who created the note
      - `created_at` (timestamptz)
    
    - `lead_status_history` - Track status changes over time
      - `id` (uuid, primary key)
      - `lead_id` (uuid, foreign key to leads)
      - `status` (text) - Lead status
      - `changed_by` (text) - User who changed status
      - `created_at` (timestamptz)

  2. Changes to `leads` table
    - Add `status` (text) - 'new', 'contacted', 'qualified', 'converted', 'lost'
    - Add `assigned_to` (text) - Team member assigned to this lead
    - Add `priority` (text) - 'low', 'medium', 'high', 'urgent'
    - Add `last_contacted` (timestamptz) - Last time lead was contacted
    - Add `conversion_probability` (integer) - 0-100 likelihood score
    - Add `estimated_value` (integer) - Potential revenue value
    - Add `next_follow_up` (timestamptz) - Scheduled follow-up date
    - Add `is_duplicate` (boolean) - Flagged as duplicate
    - Add `duplicate_of` (uuid) - Reference to original lead if duplicate
    - Add `updated_at` (timestamptz) - Last update timestamp

  3. Security
    - Enable RLS on all new tables
    - Add policies for public access (password gate handles auth)

  4. Indexes
    - Add indexes for filtering and searching
    - Add full-text search capabilities for business names
*/

-- Add new columns to leads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'status'
  ) THEN
    ALTER TABLE leads ADD COLUMN status text DEFAULT 'new';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE leads ADD COLUMN assigned_to text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'priority'
  ) THEN
    ALTER TABLE leads ADD COLUMN priority text DEFAULT 'medium';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'last_contacted'
  ) THEN
    ALTER TABLE leads ADD COLUMN last_contacted timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'conversion_probability'
  ) THEN
    ALTER TABLE leads ADD COLUMN conversion_probability integer CHECK (conversion_probability >= 0 AND conversion_probability <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'estimated_value'
  ) THEN
    ALTER TABLE leads ADD COLUMN estimated_value integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'next_follow_up'
  ) THEN
    ALTER TABLE leads ADD COLUMN next_follow_up timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'is_duplicate'
  ) THEN
    ALTER TABLE leads ADD COLUMN is_duplicate boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'duplicate_of'
  ) THEN
    ALTER TABLE leads ADD COLUMN duplicate_of uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE leads ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create lead_tags table
CREATE TABLE IF NOT EXISTS lead_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_tags_name ON lead_tags(name);

ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to lead_tags"
  ON lead_tags FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to lead_tags"
  ON lead_tags FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to lead_tags"
  ON lead_tags FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow public delete from lead_tags"
  ON lead_tags FOR DELETE
  TO anon
  USING (true);

-- Create lead_tag_assignments table
CREATE TABLE IF NOT EXISTS lead_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES lead_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_lead ON lead_tag_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_tag ON lead_tag_assignments(tag_id);

ALTER TABLE lead_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to lead_tag_assignments"
  ON lead_tag_assignments FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create lead_notes table
CREATE TABLE IF NOT EXISTS lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  note text NOT NULL,
  note_type text DEFAULT 'general' CHECK (note_type IN ('call', 'email', 'meeting', 'general')),
  created_by text DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created ON lead_notes(created_at DESC);

ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to lead_notes"
  ON lead_notes FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create lead_status_history table
CREATE TABLE IF NOT EXISTS lead_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_by text DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead ON lead_status_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_created ON lead_status_history(created_at DESC);

ALTER TABLE lead_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to lead_status_history"
  ON lead_status_history FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create indexes on leads table for new columns
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON leads(next_follow_up);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_is_duplicate ON leads(is_duplicate);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leads table
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default tags
INSERT INTO lead_tags (name, color) VALUES
  ('Hot Lead', '#ef4444'),
  ('Qualified', '#10b981'),
  ('Follow Up', '#f59e0b'),
  ('Long Term', '#3b82f6'),
  ('Not Interested', '#6b7280')
ON CONFLICT (name) DO NOTHING;