/*
  # Fix leads table RLS for service role inserts

  1. Changes
    - Add policy to allow service role (edge functions) to insert leads
    - Service role bypasses RLS by default, but we need to ensure inserts work

  2. Security
    - Existing policies remain for authenticated users
    - Service role can insert (needed for automated lead discovery)
*/

-- Drop existing "Admins can manage leads" policy and recreate with proper INSERT handling
DROP POLICY IF EXISTS "Admins can manage leads" ON leads;

-- Separate policies for better control
CREATE POLICY "Admins can insert leads"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can update leads"
  ON leads
  FOR UPDATE
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

CREATE POLICY "Admins can delete leads"
  ON leads
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Service role inserts (from edge functions) - this allows inserts without auth.uid()
CREATE POLICY "Service role can insert leads"
  ON leads
  FOR INSERT
  TO service_role
  WITH CHECK (true);