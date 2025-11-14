/*
  # Restore Admin CRUD Policies
  
  Add back INSERT, UPDATE, DELETE policies for admins that were
  accidentally removed during cleanup
*/

-- CLIENTS - Admin CRUD
CREATE POLICY "Admins can insert clients"
  ON clients FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

CREATE POLICY "Admins can update clients"
  ON clients FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

-- REPORT_ASSIGNMENTS - Admin CRUD
CREATE POLICY "Admins can insert report assignments"
  ON report_assignments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

CREATE POLICY "Admins can update report assignments"
  ON report_assignments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

CREATE POLICY "Admins can delete report assignments"
  ON report_assignments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

-- SEO_AUDITS - Admin CRUD
CREATE POLICY "Admins can insert seo audits"
  ON seo_audits FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

CREATE POLICY "Admins can update seo audits"
  ON seo_audits FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

CREATE POLICY "Admins can delete seo audits"
  ON seo_audits FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

-- SECURITY_SCANS - Admin CRUD
CREATE POLICY "Admins can insert security scans"
  ON security_scans FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

CREATE POLICY "Admins can update security scans"
  ON security_scans FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

CREATE POLICY "Admins can delete security scans"
  ON security_scans FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

-- GENERATED_CONTENT - Admin CRUD
CREATE POLICY "Admins can insert content"
  ON generated_content FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

CREATE POLICY "Admins can update content"
  ON generated_content FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

CREATE POLICY "Admins can delete content"
  ON generated_content FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

-- AUTOMATED_CAMPAIGNS - Admin CRUD
CREATE POLICY "Admins can insert campaigns"
  ON automated_campaigns FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

CREATE POLICY "Admins can update campaigns"
  ON automated_campaigns FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

CREATE POLICY "Admins can delete campaigns"
  ON automated_campaigns FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));
