# CandlPage Client Portal - Setup Guide

## Overview

CandlPage now includes a complete client portal system with two distinct user experiences:

1. **Admin Portal** - For C&L Strategy team members to manage clients and create reports
2. **Client Portal** - For clients to view their reports, leads, and content

## Database Setup

The client portal system has been fully configured with:

- Client and user management tables
- Role-based access control (Admin vs Client)
- Secure Row Level Security policies
- All existing tables updated with `client_id` foreign keys

## Getting Started

### 1. Create Your First Admin User

You need to create admin users in Supabase Auth and then add them to the `admin_users` table:

```sql
-- After creating a user in Supabase Auth, add them as an admin:
INSERT INTO admin_users (id, email, full_name, role, is_active)
VALUES (
  'USER_UUID_FROM_AUTH',  -- Get this from auth.users table
  'admin@candlstrategy.com',
  'Admin Name',
  'super_admin',  -- Options: 'super_admin', 'admin', 'analyst'
  true
);
```

### 2. Create Your First Client

Once logged in as an admin, you can:

1. Navigate to "Client Management" from the admin dashboard
2. Click "Add Client"
3. Fill in client details:
   - Company Name
   - Industry
   - Contact Information
   - Subscription Tier (Starter, Professional, Enterprise)
   - Status (Active, Suspended, Cancelled)

### 3. Create Client Users

After creating a client company, you need to create user accounts for that client:

```sql
-- First create the user in Supabase Auth, then:
INSERT INTO client_users (id, client_id, email, full_name, role, is_active)
VALUES (
  'USER_UUID_FROM_AUTH',
  'CLIENT_ID',
  'client@company.com',
  'Client Name',
  'owner',  -- Options: 'owner', 'admin', 'member', 'viewer'
  true
);
```

### 4. Assign Reports to Clients

When creating reports (SEO audits, security scans, etc.) from the admin tools, you can now assign them to specific clients. This is done automatically if you:

1. Select a client from the dropdown when creating reports (feature coming soon)
2. Or manually update existing reports:

```sql
UPDATE seo_audits
SET client_id = 'CLIENT_ID'
WHERE id = 'AUDIT_ID';

UPDATE security_scans
SET client_id = 'CLIENT_ID'
WHERE id = 'SCAN_ID';

UPDATE leads
SET client_id = 'CLIENT_ID'
WHERE id = 'LEAD_ID';
```

## User Roles

### Admin Roles
- **super_admin** - Full access to everything including user management
- **admin** - Access to all client data and report creation
- **analyst** - Access to report creation tools

### Client Roles
- **owner** - Full access to client's data, can manage other client users
- **admin** - Access to client's data, limited management
- **member** - Standard access to client's data
- **viewer** - Read-only access to client's data

## Features

### Admin Portal Features
- SEO/AEO Audit tool
- Security Scanner
- Content Generation Suite
- Lead Generator
- Automated Lead Discovery Campaigns
- **Client Management** (new!)
  - Create and edit clients
  - Manage client users
  - View client activity
  - Control access permissions

### Client Portal Features
- Dashboard with statistics
- View SEO Audits assigned to them
- View Business Leads discovered for them
- View Security Scans (coming soon)
- View Generated Content (coming soon)
- Message C&L Strategy team (coming soon)
- Notification system (coming soon)

## Security

### Data Isolation
- All data is isolated by `client_id`
- RLS policies ensure clients only see their own data
- Admins have full access to all data
- Unauthenticated users have no access

### Authentication
- Supabase Auth handles all authentication
- Email/password authentication by default
- Role-based access control at database level
- Secure session management

## Next Steps

### Immediate Todo
1. Create your first admin user in Supabase Dashboard
2. Add them to the `admin_users` table
3. Log in and create a test client
4. Create a client user account
5. Test logging in as both admin and client

### Future Enhancements
- Client selector dropdown in report creation tools
- Security scan viewer for clients
- Generated content viewer for clients
- In-app messaging system
- Email notifications for new reports
- Client user management UI for admins
- Bulk report assignment tool
- Client analytics dashboard
- Report commenting system

## Troubleshooting

### Can't log in
- Ensure the user exists in `auth.users`
- Check they're in either `admin_users` or `client_users` table
- Verify `is_active` is set to `true`

### Client can't see reports
- Verify the `client_id` is set on the reports
- Check the client user's `client_id` matches
- Ensure reports have been assigned to that client

### Permission denied errors
- RLS policies are very strict
- Only authenticated users with proper roles can access data
- Check the user's role in their respective table

## Support

For technical support or questions about the client portal system, contact the development team.

---

**Built with:** React, TypeScript, Supabase, Tailwind CSS
