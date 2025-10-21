/*
  # Automated Lead Campaign System

  1. New Tables
    - `automated_campaigns`
      - `id` (uuid, primary key)
      - `name` (text) - Campaign name
      - `geography` (text) - Geographic area to search
      - `status` (text) - 'active', 'paused', 'completed'
      - `schedule` (text) - 'weekly', 'daily', 'monthly', 'once'
      - `next_run` (timestamptz) - Next scheduled run time
      - `last_run` (timestamptz) - Last execution time
      - `industries_to_search` (integer) - Number of top industries to find (default 3)
      - `leads_per_industry` (integer) - Number of leads per industry (default 10)
      - `email_recipients` (jsonb) - Array of email addresses
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `campaign_runs`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to automated_campaigns)
      - `geography` (text) - Geography searched
      - `industries_found` (jsonb) - Array of industries identified
      - `total_leads_found` (integer) - Total leads discovered
      - `status` (text) - 'pending', 'running', 'completed', 'failed'
      - `error_message` (text) - Error details if failed
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `campaign_run_leads`
      - `id` (uuid, primary key)
      - `campaign_run_id` (uuid, foreign key to campaign_runs)
      - `lead_id` (uuid, foreign key to leads)
      - `industry` (text) - Industry this lead belongs to
      - `created_at` (timestamptz)
    
    - `email_delivery_log`
      - `id` (uuid, primary key)
      - `campaign_run_id` (uuid, foreign key to campaign_runs)
      - `recipient_email` (text) - Email address
      - `status` (text) - 'pending', 'sent', 'failed'
      - `error_message` (text) - Error details if failed
      - `sent_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access

  3. Indexes
    - Add indexes for efficient querying and scheduling
*/

-- Create automated_campaigns table
CREATE TABLE IF NOT EXISTS automated_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  geography text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  schedule text DEFAULT 'weekly' CHECK (schedule IN ('weekly', 'daily', 'monthly', 'once')),
  next_run timestamptz,
  last_run timestamptz,
  industries_to_search integer DEFAULT 3,
  leads_per_industry integer DEFAULT 10,
  email_recipients jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automated_campaigns_status ON automated_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_automated_campaigns_next_run ON automated_campaigns(next_run);
CREATE INDEX IF NOT EXISTS idx_automated_campaigns_geography ON automated_campaigns(geography);

ALTER TABLE automated_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to automated_campaigns"
  ON automated_campaigns FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create campaign_runs table
CREATE TABLE IF NOT EXISTS campaign_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES automated_campaigns(id) ON DELETE CASCADE,
  geography text NOT NULL,
  industries_found jsonb DEFAULT '[]'::jsonb,
  total_leads_found integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_runs_campaign ON campaign_runs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_runs_status ON campaign_runs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_runs_created ON campaign_runs(created_at DESC);

ALTER TABLE campaign_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to campaign_runs"
  ON campaign_runs FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create campaign_run_leads junction table
CREATE TABLE IF NOT EXISTS campaign_run_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_run_id uuid NOT NULL REFERENCES campaign_runs(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  industry text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_run_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_run_leads_run ON campaign_run_leads(campaign_run_id);
CREATE INDEX IF NOT EXISTS idx_campaign_run_leads_lead ON campaign_run_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_campaign_run_leads_industry ON campaign_run_leads(industry);

ALTER TABLE campaign_run_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to campaign_run_leads"
  ON campaign_run_leads FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create email_delivery_log table
CREATE TABLE IF NOT EXISTS email_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_run_id uuid REFERENCES campaign_runs(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_delivery_log_run ON email_delivery_log(campaign_run_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_log_status ON email_delivery_log(status);
CREATE INDEX IF NOT EXISTS idx_email_delivery_log_recipient ON email_delivery_log(recipient_email);

ALTER TABLE email_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to email_delivery_log"
  ON email_delivery_log FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create trigger for automated_campaigns updated_at
DROP TRIGGER IF EXISTS update_automated_campaigns_updated_at ON automated_campaigns;
CREATE TRIGGER update_automated_campaigns_updated_at
  BEFORE UPDATE ON automated_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default campaign for the team
INSERT INTO automated_campaigns (
  name,
  geography,
  status,
  schedule,
  industries_to_search,
  leads_per_industry,
  email_recipients,
  next_run
) VALUES (
  'Weekly Multi-Industry Lead Discovery',
  'United States',
  'active',
  'weekly',
  3,
  10,
  '["tj@infinitydigitalsolution.com", "leland@candlstrategy.com", "lorenzo@infinitydigitalsolution.com", "korbin@infinitydigitalsolution.com"]'::jsonb,
  now() + interval '1 week'
) ON CONFLICT DO NOTHING;