-- Setup Test Users for CandlPage
-- Run this SQL in the Supabase SQL Editor

-- First, create the auth users using Supabase's auth.users table
-- Note: Passwords need to be hashed. We'll use pgcrypto extension

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert auth users directly (this bypasses normal signup flow)
-- The passwords will be hashed using crypt function

-- Insert Leland
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'leland@candlstrategy.com',
  crypt('GoBrowns333', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Insert Lorenzo
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'Lorenzo@infinitydigitalconsulting.com',
  crypt('LoLoco3', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Insert Korbin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'Korbin@infinitydigitalconsulting.com',
  crypt('KoKoChanel3', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Now add them to admin_users table
-- You'll need to get the UUIDs from the auth.users table first

-- Add to admin_users using the auth.users IDs
INSERT INTO admin_users (id, email, full_name, role, is_active)
SELECT id, email,
  CASE
    WHEN email = 'leland@candlstrategy.com' THEN 'Leland'
    WHEN email = 'Lorenzo@infinitydigitalconsulting.com' THEN 'Lorenzo'
    WHEN email = 'Korbin@infinitydigitalconsulting.com' THEN 'Korbin'
  END,
  'super_admin',
  true
FROM auth.users
WHERE email IN (
  'leland@candlstrategy.com',
  'Lorenzo@infinitydigitalconsulting.com',
  'Korbin@infinitydigitalconsulting.com'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  is_active = true;

-- Verify the users were created
SELECT u.id, u.email, au.full_name, au.role, au.is_active
FROM auth.users u
LEFT JOIN admin_users au ON u.id = au.id
WHERE u.email IN (
  'leland@candlstrategy.com',
  'Lorenzo@infinitydigitalconsulting.com',
  'Korbin@infinitydigitalconsulting.com'
);
