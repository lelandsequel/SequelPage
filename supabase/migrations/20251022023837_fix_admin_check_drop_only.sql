/*
  # Fix Admin Check - Drop and Recreate Function Only

  1. Changes
    - Drop function with CASCADE (removes policies automatically)
    - Recreate function with proper type and permissions
    - Recreate all policies with IF NOT EXISTS

  2. Security
    - Function properly granted to authenticated users
*/

-- Drop function with CASCADE
DROP FUNCTION IF EXISTS is_active_admin(uuid) CASCADE;

-- Recreate the function
CREATE OR REPLACE FUNCTION is_active_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_id AND is_active = true
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_active_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_active_admin(uuid) TO anon;

-- Recreate policies with IF NOT EXISTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Client users can view own record' AND tablename = 'client_users'
  ) THEN
    CREATE POLICY "Client users can view own record"
      ON client_users FOR SELECT TO authenticated
      USING (id = auth.uid() AND is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Client users can update own record' AND tablename = 'client_users'
  ) THEN
    CREATE POLICY "Client users can update own record"
      ON client_users FOR UPDATE TO authenticated
      USING (id = auth.uid() AND is_active = true)
      WITH CHECK (id = auth.uid() AND is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all client users' AND tablename = 'client_users'
  ) THEN
    CREATE POLICY "Admins can view all client users"
      ON client_users FOR SELECT TO authenticated
      USING (is_active_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert client users' AND tablename = 'client_users'
  ) THEN
    CREATE POLICY "Admins can insert client users"
      ON client_users FOR INSERT TO authenticated
      WITH CHECK (is_active_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update client users' AND tablename = 'client_users'
  ) THEN
    CREATE POLICY "Admins can update client users"
      ON client_users FOR UPDATE TO authenticated
      USING (is_active_admin(auth.uid()))
      WITH CHECK (is_active_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete client users' AND tablename = 'client_users'
  ) THEN
    CREATE POLICY "Admins can delete client users"
      ON client_users FOR DELETE TO authenticated
      USING (is_active_admin(auth.uid()));
  END IF;
END $$;
