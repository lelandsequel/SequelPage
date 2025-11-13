/*
  # Optimize RLS Performance - Part 2
  
  Continue optimizing remaining tables
*/

-- LEADS
DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
CREATE POLICY "Admins can view all leads" ON leads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Client users can view their leads" ON leads;
CREATE POLICY "Client users can view their leads" ON leads FOR SELECT TO authenticated
  USING (client_id IN (SELECT client_id FROM client_users WHERE client_users.id = (select auth.uid()) AND client_users.is_active = true));

DROP POLICY IF EXISTS "Admins can insert leads" ON leads;
CREATE POLICY "Admins can insert leads" ON leads FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Admins can update leads" ON leads;
CREATE POLICY "Admins can update leads" ON leads FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Admins can delete leads" ON leads;
CREATE POLICY "Admins can delete leads" ON leads FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

-- AUTOMATED_CAMPAIGNS
DROP POLICY IF EXISTS "Admins can view all campaigns" ON automated_campaigns;
CREATE POLICY "Admins can view all campaigns" ON automated_campaigns FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Client users can view their campaigns" ON automated_campaigns;
CREATE POLICY "Client users can view their campaigns" ON automated_campaigns FOR SELECT TO authenticated
  USING (client_id IN (SELECT client_id FROM client_users WHERE client_users.id = (select auth.uid()) AND client_users.is_active = true));

DROP POLICY IF EXISTS "Admins can manage campaigns" ON automated_campaigns;
CREATE POLICY "Admins can manage campaigns" ON automated_campaigns FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

-- ADMIN_USERS
DROP POLICY IF EXISTS "Users can view own admin record" ON admin_users;
CREATE POLICY "Users can view own admin record" ON admin_users FOR SELECT TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON admin_users;

CREATE POLICY "Super admins can insert admin users" ON admin_users FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.role = 'super_admin' AND admin_users.is_active = true));

CREATE POLICY "Super admins can update admin users" ON admin_users FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = (select auth.uid()) AND au.role = 'super_admin' AND au.is_active = true));

CREATE POLICY "Super admins can delete admin users" ON admin_users FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.role = 'super_admin' AND admin_users.is_active = true));

-- CLIENT_USERS
DROP POLICY IF EXISTS "Client users can view own record" ON client_users;
DROP POLICY IF EXISTS "Client users can view their own record" ON client_users;
CREATE POLICY "Client users can view own record" ON client_users FOR SELECT TO authenticated
  USING (id = (select auth.uid()) AND is_active = true);

DROP POLICY IF EXISTS "Client users can update own record" ON client_users;
DROP POLICY IF EXISTS "Client users can update their own record" ON client_users;
CREATE POLICY "Client users can update own record" ON client_users FOR UPDATE TO authenticated
  USING (id = (select auth.uid()) AND is_active = true)
  WITH CHECK (id = (select auth.uid()) AND is_active = true);

DROP POLICY IF EXISTS "Admins can view all client users" ON client_users;
CREATE POLICY "Admins can view all client users" ON client_users FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Admins can manage client users" ON client_users;
DROP POLICY IF EXISTS "Admins can insert client users" ON client_users;
DROP POLICY IF EXISTS "Admins can update client users" ON client_users;
DROP POLICY IF EXISTS "Admins can delete client users" ON client_users;

CREATE POLICY "Admins can insert client users" ON client_users FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

CREATE POLICY "Admins can update client users" ON client_users FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));

CREATE POLICY "Admins can delete client users" ON client_users FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = (select auth.uid()) AND admin_users.is_active = true));
