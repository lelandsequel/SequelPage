/*
  # Fix Client Users RLS Policy Recursion
  
  Similar to admin_users, the client_users policies were causing recursion.
  This fixes the issue by creating simpler, non-recursive policies.
  
  1. Drop existing recursive policies
  2. Create new policies that allow users to read their own record
  3. Create admin management policies using subqueries to avoid recursion
*/

-- Drop existing policies on client_users that check admin_users recursively
DROP POLICY IF EXISTS "Admins can view all client users" ON client_users;
DROP POLICY IF EXISTS "Admins can manage client users" ON client_users;

-- Recreate with subquery to avoid recursion
CREATE POLICY "Admins can view all client users"
  ON client_users FOR SELECT
  TO authenticated
  USING (
    (SELECT is_active FROM admin_users WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can insert client users"
  ON client_users FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT is_active FROM admin_users WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can update client users"
  ON client_users FOR UPDATE
  TO authenticated
  USING (
    (SELECT is_active FROM admin_users WHERE id = auth.uid()) = true
  )
  WITH CHECK (
    (SELECT is_active FROM admin_users WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can delete client users"
  ON client_users FOR DELETE
  TO authenticated
  USING (
    (SELECT is_active FROM admin_users WHERE id = auth.uid()) = true
  );
