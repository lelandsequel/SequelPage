/*
  # Fix Client Users RLS Policies

  1. Changes
    - Drop all existing client_users policies
    - Create simpler, non-recursive policies
    - Allow admins to manage all client users
    - Allow client users to view only their own record

  2. Security
    - Admins verified via admin_users table (no recursion)
    - Client users can only access their own data
    - All operations require authentication
*/

-- Drop all existing policies on client_users
DROP POLICY IF EXISTS "Client users can view their own record" ON client_users;
DROP POLICY IF EXISTS "Client users can update their own record" ON client_users;
DROP POLICY IF EXISTS "Admins can view all client users" ON client_users;
DROP POLICY IF EXISTS "Admins can insert client users" ON client_users;
DROP POLICY IF EXISTS "Admins can update client users" ON client_users;
DROP POLICY IF EXISTS "Admins can delete client users" ON client_users;

-- Create a function to check if user is an active admin (avoids recursion in policies)
CREATE OR REPLACE FUNCTION is_active_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_id AND is_active = true
  );
$$;

-- Client users can view their own record
CREATE POLICY "Client users can view own record"
  ON client_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() AND is_active = true);

-- Client users can update their own record
CREATE POLICY "Client users can update own record"
  ON client_users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND is_active = true)
  WITH CHECK (id = auth.uid() AND is_active = true);

-- Admins can view all client users
CREATE POLICY "Admins can view all client users"
  ON client_users
  FOR SELECT
  TO authenticated
  USING (is_active_admin(auth.uid()));

-- Admins can insert client users
CREATE POLICY "Admins can insert client users"
  ON client_users
  FOR INSERT
  TO authenticated
  WITH CHECK (is_active_admin(auth.uid()));

-- Admins can update client users
CREATE POLICY "Admins can update client users"
  ON client_users
  FOR UPDATE
  TO authenticated
  USING (is_active_admin(auth.uid()))
  WITH CHECK (is_active_admin(auth.uid()));

-- Admins can delete client users
CREATE POLICY "Admins can delete client users"
  ON client_users
  FOR DELETE
  TO authenticated
  USING (is_active_admin(auth.uid()));
