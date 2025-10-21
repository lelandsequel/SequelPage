/*
  # Client Portal System

  ## Overview
  This migration adds a complete client portal system to CandlPage, enabling C&L Strategy
  to provide secure, branded access to reports and services for their clients.

  ## 1. New Tables

  ### `clients`
  Stores client company information and subscription details

  ### `admin_users`
  C&L Strategy team member accounts

  ### `client_users`
  Individual user accounts associated with client companies

  ### `client_notifications`
  In-app notifications for clients

  ### `report_assignments`
  Links reports to specific clients

  ### `client_messages`
  Communication between clients and C&L Strategy team

  ## 2. Data Associations
  Add client_id columns to existing tables to link data to clients

  ## 3. Security
  - Enable RLS on all new tables
  - Clients can only see their own data
  - Admins can see all data
  - Proper role-based access control

  ## 4. Indexes
  Optimized indexes for common query patterns and relationships
*/

-- Create helper function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  industry text,
  website text,
  contact_name text NOT NULL,
  contact_email text UNIQUE NOT NULL,
  contact_phone text,
  logo_url text,
  subscription_tier text DEFAULT 'professional' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
  onboarded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(subscription_status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(contact_email);
CREATE INDEX IF NOT EXISTS idx_clients_created ON clients(created_at DESC);

-- Create admin_users table (must be created before policies reference it)
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'analyst' CHECK (role IN ('super_admin', 'admin', 'analyst')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- Create client_users table
CREATE TABLE IF NOT EXISTS client_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_users_client ON client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);
CREATE INDEX IF NOT EXISTS idx_client_users_active ON client_users(is_active);

-- Create client_notifications table
CREATE TABLE IF NOT EXISTS client_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('report_ready', 'audit_complete', 'new_leads', 'message', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_client ON client_notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON client_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON client_notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON client_notifications(created_at DESC);

-- Create report_assignments table
CREATE TABLE IF NOT EXISTS report_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('seo_audit', 'security_scan', 'content', 'leads', 'campaign')),
  report_id uuid NOT NULL,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  client_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_assignments_client ON report_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_report_assignments_type ON report_assignments(report_type);
CREATE INDEX IF NOT EXISTS idx_report_assignments_report ON report_assignments(report_id);
CREATE INDEX IF NOT EXISTS idx_report_assignments_visible ON report_assignments(client_visible);

-- Create client_messages table
CREATE TABLE IF NOT EXISTS client_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_from_client boolean NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  parent_message_id uuid REFERENCES client_messages(id) ON DELETE SET NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_client ON client_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON client_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON client_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON client_messages(created_at DESC);

-- Add client_id to existing tables
ALTER TABLE seo_audits ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE security_scans ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE generated_content ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE automated_campaigns ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_seo_audits_client ON seo_audits(client_id);
CREATE INDEX IF NOT EXISTS idx_security_scans_client ON security_scans(client_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_client ON generated_content(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_client ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_automated_campaigns_client ON automated_campaigns(client_id);

-- Enable RLS and create policies NOW that all tables exist

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage clients"
  ON clients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Client users can view their own client"
  ON clients FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT client_id FROM client_users
      WHERE client_users.id = auth.uid()
      AND client_users.is_active = true
    )
  );

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.is_active = true
    )
  );

CREATE POLICY "Super admins can manage admin users"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  );

ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all client users"
  ON client_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage client users"
  ON client_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Client users can view their own record"
  ON client_users FOR SELECT
  TO authenticated
  USING (id = auth.uid() AND is_active = true);

CREATE POLICY "Client users can update their own record"
  ON client_users FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND is_active = true)
  WITH CHECK (id = auth.uid() AND is_active = true);

ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all notifications"
  ON client_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Client users can view their notifications"
  ON client_notifications FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM client_users
      WHERE client_users.id = auth.uid()
      AND client_users.is_active = true
    )
  );

CREATE POLICY "Client users can update their notifications"
  ON client_notifications FOR UPDATE
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM client_users
      WHERE client_users.id = auth.uid()
      AND client_users.is_active = true
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM client_users
      WHERE client_users.id = auth.uid()
      AND client_users.is_active = true
    )
  );

ALTER TABLE report_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all report assignments"
  ON report_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage report assignments"
  ON report_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Client users can view their visible assignments"
  ON report_assignments FOR SELECT
  TO authenticated
  USING (
    client_visible = true
    AND client_id IN (
      SELECT client_id FROM client_users
      WHERE client_users.id = auth.uid()
      AND client_users.is_active = true
    )
  );

ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all messages"
  ON client_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can send messages"
  ON client_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Client users can view their messages"
  ON client_messages FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM client_users
      WHERE client_users.id = auth.uid()
      AND client_users.is_active = true
    )
  );

CREATE POLICY "Client users can send messages"
  ON client_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM client_users
      WHERE client_users.id = auth.uid()
      AND client_users.is_active = true
    )
  );

CREATE POLICY "Users can update their own messages"
  ON client_messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Update RLS policies for existing tables

DROP POLICY IF EXISTS "Allow public read access to seo_audits" ON seo_audits;
DROP POLICY IF EXISTS "Allow public insert to seo_audits" ON seo_audits;

CREATE POLICY "Admins can view all seo audits"
  ON seo_audits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Client users can view their audits"
  ON seo_audits FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM client_users
      WHERE client_users.id = auth.uid()
      AND client_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage seo audits"
  ON seo_audits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Allow public read access to security_scans" ON security_scans;
DROP POLICY IF EXISTS "Allow public insert to security_scans" ON security_scans;

CREATE POLICY "Admins can view all security scans"
  ON security_scans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Client users can view their scans"
  ON security_scans FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM client_users
      WHERE client_users.id = auth.uid()
      AND client_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage security scans"
  ON security_scans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Allow public read access to generated_content" ON generated_content;
DROP POLICY IF EXISTS "Allow public insert to generated_content" ON generated_content;

CREATE POLICY "Admins can view all content"
  ON generated_content FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Client users can view their content"
  ON generated_content FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM client_users
      WHERE client_users.id = auth.uid()
      AND client_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage content"
  ON generated_content FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Allow public read access to leads" ON leads;
DROP POLICY IF EXISTS "Allow public insert to leads" ON leads;

CREATE POLICY "Admins can view all leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Client users can view their leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM client_users
      WHERE client_users.id = auth.uid()
      AND client_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage leads"
  ON leads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Allow public access to automated_campaigns" ON automated_campaigns;

CREATE POLICY "Admins can view all campaigns"
  ON automated_campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Client users can view their campaigns"
  ON automated_campaigns FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM client_users
      WHERE client_users.id = auth.uid()
      AND client_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage campaigns"
  ON automated_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_users_updated_at ON client_users;
CREATE TRIGGER update_client_users_updated_at
  BEFORE UPDATE ON client_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();