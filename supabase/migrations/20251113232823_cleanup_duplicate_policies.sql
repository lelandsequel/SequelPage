/*
  # Cleanup Duplicate Policies and Functions
  
  Remove overlapping policies that create "Multiple Permissive Policies" warnings
  and clean up duplicate functions
*/

-- Drop old function versions
DROP FUNCTION IF EXISTS is_active_admin();

-- Recreate with proper signature
CREATE OR REPLACE FUNCTION is_active_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND is_active = true
  );
END;
$$;

-- Remove duplicate "manage" policies that overlap with specific CRUD policies
DROP POLICY IF EXISTS "Admins can manage clients" ON clients;
DROP POLICY IF EXISTS "Admins can manage report assignments" ON report_assignments;
DROP POLICY IF EXISTS "Admins can manage seo audits" ON seo_audits;
DROP POLICY IF EXISTS "Admins can manage security scans" ON security_scans;
DROP POLICY IF EXISTS "Admins can manage content" ON generated_content;
DROP POLICY IF EXISTS "Admins can manage campaigns" ON automated_campaigns;

-- Remove old generic authenticated policies
DROP POLICY IF EXISTS "Allow authenticated read access to seo_audits" ON seo_audits;
DROP POLICY IF EXISTS "Allow authenticated insert to seo_audits" ON seo_audits;
DROP POLICY IF EXISTS "Allow authenticated read access to security_scans" ON security_scans;
DROP POLICY IF EXISTS "Allow authenticated insert to security_scans" ON security_scans;
DROP POLICY IF EXISTS "Allow authenticated read access to generated_content" ON generated_content;
DROP POLICY IF EXISTS "Allow authenticated insert to generated_content" ON generated_content;
