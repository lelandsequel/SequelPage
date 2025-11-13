/*
  # Optimize RLS Performance - Part 1
  
  Fix performance by replacing auth.uid() with (select auth.uid())
  in all RLS policies for better query performance
*/

-- Add missing index
CREATE INDEX IF NOT EXISTS idx_report_assignments_assigned_by ON report_assignments(assigned_by);

-- Fix function search paths
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION is_active_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$ BEGIN RETURN EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true); END; $$;

-- CLIENTS
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
CREATE POLICY "Admins can view all clients" ON clients FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Admins can manage clients" ON clients;
CREATE POLICY "Admins can manage clients" ON clients FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Client users can view their own client" ON clients;
CREATE POLICY "Client users can view their own client" ON clients FOR SELECT TO authenticated
  USING (id IN (SELECT client_id FROM client_users WHERE client_users.id = (select auth.uid()) AND client_users.is_active = true));

-- CLIENT_MESSAGES
DROP POLICY IF EXISTS "Admins can view all messages" ON client_messages;
CREATE POLICY "Admins can view all messages" ON client_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Admins can send messages" ON client_messages;
CREATE POLICY "Admins can send messages" ON client_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Client users can view their messages" ON client_messages;
CREATE POLICY "Client users can view their messages" ON client_messages FOR SELECT TO authenticated
  USING (client_id IN (SELECT client_id FROM client_users WHERE client_users.id = (select auth.uid()) AND client_users.is_active = true));

DROP POLICY IF EXISTS "Client users can send messages" ON client_messages;
CREATE POLICY "Client users can send messages" ON client_messages FOR INSERT TO authenticated
  WITH CHECK (client_id IN (SELECT client_id FROM client_users WHERE client_users.id = (select auth.uid()) AND client_users.is_active = true));

DROP POLICY IF EXISTS "Users can update their own messages" ON client_messages;
CREATE POLICY "Users can update their own messages" ON client_messages FOR UPDATE TO authenticated
  USING (sender_id = (select auth.uid())) WITH CHECK (sender_id = (select auth.uid()));

-- CLIENT_NOTIFICATIONS
DROP POLICY IF EXISTS "Admins can view all notifications" ON client_notifications;
CREATE POLICY "Admins can view all notifications" ON client_notifications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Client users can view their notifications" ON client_notifications;
CREATE POLICY "Client users can view their notifications" ON client_notifications FOR SELECT TO authenticated
  USING (client_id IN (SELECT client_id FROM client_users WHERE client_users.id = (select auth.uid()) AND client_users.is_active = true));

DROP POLICY IF EXISTS "Client users can update their notifications" ON client_notifications;
CREATE POLICY "Client users can update their notifications" ON client_notifications FOR UPDATE TO authenticated
  USING (client_id IN (SELECT client_id FROM client_users WHERE client_users.id = (select auth.uid()) AND client_users.is_active = true))
  WITH CHECK (client_id IN (SELECT client_id FROM client_users WHERE client_users.id = (select auth.uid()) AND client_users.is_active = true));

-- REPORT_ASSIGNMENTS
DROP POLICY IF EXISTS "Admins can view all report assignments" ON report_assignments;
CREATE POLICY "Admins can view all report assignments" ON report_assignments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Admins can manage report assignments" ON report_assignments;
CREATE POLICY "Admins can manage report assignments" ON report_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Client users can view their visible assignments" ON report_assignments;
CREATE POLICY "Client users can view their visible assignments" ON report_assignments FOR SELECT TO authenticated
  USING (client_visible = true AND client_id IN (SELECT client_id FROM client_users WHERE client_users.id = (select auth.uid()) AND client_users.is_active = true));

-- SEO_AUDITS
DROP POLICY IF EXISTS "Admins can view all seo audits" ON seo_audits;
CREATE POLICY "Admins can view all seo audits" ON seo_audits FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Client users can view their audits" ON seo_audits;
CREATE POLICY "Client users can view their audits" ON seo_audits FOR SELECT TO authenticated
  USING (client_id IN (SELECT client_id FROM client_users WHERE client_users.id = (select auth.uid()) AND client_users.is_active = true));

DROP POLICY IF EXISTS "Admins can manage seo audits" ON seo_audits;
CREATE POLICY "Admins can manage seo audits" ON seo_audits FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

-- SECURITY_SCANS
DROP POLICY IF EXISTS "Admins can view all security scans" ON security_scans;
CREATE POLICY "Admins can view all security scans" ON security_scans FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Client users can view their scans" ON security_scans;
CREATE POLICY "Client users can view their scans" ON security_scans FOR SELECT TO authenticated
  USING (client_id IN (SELECT client_id FROM client_users WHERE client_users.id = (select auth.uid()) AND client_users.is_active = true));

DROP POLICY IF EXISTS "Admins can manage security scans" ON security_scans;
CREATE POLICY "Admins can manage security scans" ON security_scans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

-- GENERATED_CONTENT
DROP POLICY IF EXISTS "Admins can view all content" ON generated_content;
CREATE POLICY "Admins can view all content" ON generated_content FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Client users can view their content" ON generated_content;
CREATE POLICY "Client users can view their content" ON generated_content FOR SELECT TO authenticated
  USING (client_id IN (SELECT client_id FROM client_users WHERE client_users.id = (select auth.uid()) AND client_users.is_active = true));

DROP POLICY IF EXISTS "Admins can manage content" ON generated_content;
CREATE POLICY "Admins can manage content" ON generated_content FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));
