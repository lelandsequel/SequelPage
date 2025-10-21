/*
  # Fix RLS Policy Recursion
  
  The admin_users policies were causing infinite recursion by checking admin_users 
  within the admin_users policies themselves. This fixes the issue by:
  
  1. Dropping all existing admin_users policies
  2. Creating new policies that allow users to read their own record
  3. Creating policies for managing other admin users that don't cause recursion
*/

-- Drop all existing policies on admin_users
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;

-- Allow users to read their own admin_users record (no recursion)
CREATE POLICY "Users can view own admin record"
  ON admin_users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow super admins to insert new admin users
CREATE POLICY "Super admins can insert admin users"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM admin_users WHERE id = auth.uid()) = 'super_admin'
  );

-- Allow super admins to update admin users
CREATE POLICY "Super admins can update admin users"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM admin_users WHERE id = auth.uid()) = 'super_admin'
  )
  WITH CHECK (
    (SELECT role FROM admin_users WHERE id = auth.uid()) = 'super_admin'
  );

-- Allow super admins to delete admin users
CREATE POLICY "Super admins can delete admin users"
  ON admin_users FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM admin_users WHERE id = auth.uid()) = 'super_admin'
  );
