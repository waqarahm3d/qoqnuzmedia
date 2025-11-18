# Admin System - Database-Based Role Management

## Overview

The Qoqnuz Music admin system uses a **pure database-based role management approach**. Admin access is granted exclusively through the database - there are no environment variable shortcuts or auto-admin features.

## Key Principles

1. **Database Only** - All admin access is controlled through the `admin_users` table
2. **No Environment Variables** - The previous `ADMIN_EMAILS` approach has been removed
3. **Proper RLS** - Row Level Security policies ensure data integrity
4. **Service Role Auth** - Backend uses service role client to bypass RLS when checking admin status
5. **Role-Based Permissions** - Multiple role types with different permission levels

## Architecture

### Database Tables

#### `admin_roles`
Defines available admin roles and their permissions.

```sql
CREATE TABLE admin_roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**Default Roles:**
- **Super Admin** - Full system access (`["*"]`)
- **Admin** - Standard admin access (users, content, analytics)
- **Content Manager** - Content management only (no user management)
- **Viewer** - Read-only access

#### `admin_users`
Links users to their admin roles.

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  role_id UUID NOT NULL REFERENCES admin_roles(id),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Authentication Flow

```
User Request
     ↓
Middleware (middleware.ts)
     ├─ Check session (Supabase Auth)
     ├─ Use service role client
     └─ Query admin_users table
          ├─ Found → Allow access to /admin routes
          └─ Not Found → Redirect to /home
     ↓
Admin Page/API Route
     ├─ requireAdmin() or checkAdminAccess()
     ├─ Verify user session
     ├─ Use service role client
     └─ Query admin_users table with role join
          ├─ Found → Return admin data
          └─ Not Found → Return 403 Forbidden
```

### Code Files

#### `src/lib/auth/admin-middleware.ts`
Exports `requireAdmin()` function used by most admin API routes.

```typescript
export async function requireAdmin(request: NextRequest) {
  // 1. Extract user from cookies using SSR client
  // 2. Use service role client to check admin_users table
  // 3. Return user, adminUser, and response
}
```

**Usage in API routes:**
```typescript
export async function GET(request: NextRequest) {
  const { user, adminUser, response } = await requireAdmin(request);
  if (response) return response; // 401 or 403

  // Admin logic here...
}
```

#### `src/lib/auth-utils.ts`
Exports `checkAdminAccess()` function used by automation routes.

```typescript
export async function checkAdminAccess(request: NextRequest) {
  // 1. Get user from cookies
  // 2. Use service role client to check admin_users table
  // 3. Return status object
}
```

**Usage:**
```typescript
const authCheck = await checkAdminAccess(request);
if (authCheck.error) {
  return NextResponse.json(
    { error: authCheck.error },
    { status: authCheck.status }
  );
}
```

#### `middleware.ts`
Next.js middleware that protects `/admin` routes at the edge.

```typescript
if (req.nextUrl.pathname.startsWith('/admin')) {
  // 1. Check session exists
  // 2. Use service role client to check admin_users
  // 3. Redirect to /home if not admin
}
```

## Setup Instructions

### Initial Setup

1. **Run the admin setup script** in Supabase SQL Editor:
   ```bash
   # Copy contents of supabase/scripts/setup_admin_system.sql
   # Paste into Supabase SQL Editor
   # Execute
   ```

2. **Add your first admin**:
   ```sql
   INSERT INTO admin_users (user_id, role_id)
   SELECT u.id, r.id
   FROM auth.users u
   CROSS JOIN admin_roles r
   WHERE u.email = 'your-email@example.com'
     AND r.name = 'Super Admin'
   ON CONFLICT (user_id) DO UPDATE
     SET role_id = EXCLUDED.role_id;
   ```

3. **Verify**:
   ```sql
   SELECT u.email, ar.name as role
   FROM admin_users au
   JOIN auth.users u ON u.id = au.user_id
   JOIN admin_roles ar ON ar.id = au.role_id;
   ```

### Adding More Admins

**Super Admin:**
```sql
INSERT INTO admin_users (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
CROSS JOIN admin_roles r
WHERE u.email = 'new-admin@example.com'
  AND r.name = 'Super Admin'
ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id;
```

**Regular Admin:**
```sql
INSERT INTO admin_users (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
CROSS JOIN admin_roles r
WHERE u.email = 'admin@example.com'
  AND r.name = 'Admin'
ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id;
```

**Content Manager:**
```sql
INSERT INTO admin_users (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
CROSS JOIN admin_roles r
WHERE u.email = 'content@example.com'
  AND r.name = 'Content Manager'
ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id;
```

### Removing Admin Access

```sql
DELETE FROM admin_users
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

### Changing Roles

```sql
UPDATE admin_users
SET
  role_id = (SELECT id FROM admin_roles WHERE name = 'Viewer'),
  updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

## Permission System

### Current Permissions

The permission system uses a JSONB array of permission strings:

```json
{
  "Super Admin": ["*"],
  "Admin": [
    "users:read",
    "users:write",
    "content:read",
    "content:write",
    "analytics:read"
  ],
  "Content Manager": [
    "content:read",
    "content:write",
    "analytics:read"
  ],
  "Viewer": [
    "users:read",
    "content:read",
    "analytics:read"
  ]
}
```

### Checking Permissions

Use the `hasPermission()` helper from `admin-middleware.ts`:

```typescript
import { hasPermission } from '@/lib/auth/admin-middleware';

// In your route handler
const { adminUser, response } = await requireAdmin(request);
if (response) return response;

// Check specific permission
if (!hasPermission(adminUser, 'content:write')) {
  return NextResponse.json(
    { error: 'You need content:write permission' },
    { status: 403 }
  );
}
```

### Adding New Permissions

1. **Define the permission** in your code
2. **Update roles** in the database:
   ```sql
   UPDATE admin_roles
   SET permissions = permissions || '["new:permission"]'::jsonb
   WHERE name = 'Admin';
   ```

## Row Level Security (RLS)

### Policies on `admin_users`

1. **Users can check their own admin status**
   ```sql
   CREATE POLICY "Users can check their own admin status"
     ON admin_users FOR SELECT
     USING (auth.uid() = user_id);
   ```

2. **Service role has full access**
   ```sql
   CREATE POLICY "Service role can manage admin users"
     ON admin_users FOR ALL
     USING (auth.jwt() ->> 'role' = 'service_role');
   ```

### Policies on `admin_roles`

1. **Service role can read roles**
   ```sql
   CREATE POLICY "Service role can read admin roles"
     ON admin_roles FOR SELECT
     USING (auth.jwt() ->> 'role' = 'service_role');
   ```

2. **All authenticated users can read roles**
   ```sql
   CREATE POLICY "Users can read admin roles"
     ON admin_roles FOR SELECT
     USING (true);
   ```

## Troubleshooting

### "Unauthorized" Errors on Admin Pages

**Cause:** User is not authenticated
**Fix:** Sign in with a valid account

### "Forbidden" Errors on Admin Pages

**Cause:** User is authenticated but not in `admin_users` table
**Fix:** Add user to admin_users using SQL commands above

### Middleware Redirects to /home

**Cause:** User not in `admin_users` table
**Fix:** Run the SQL INSERT command to add user as admin

### RLS Policy Errors

**Cause:** Policies not set up correctly
**Fix:** Re-run `setup_admin_system.sql` script

### Can't Query admin_users Table

**Cause:** Using regular client instead of service role client
**Fix:** Use `createAdminSupabaseClient()` from `@/lib/supabase`

## Security Considerations

1. **Service Role Key** - Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
2. **RLS Enabled** - Always keep RLS enabled on admin tables
3. **Permission Checks** - Always check permissions before sensitive operations
4. **Audit Trail** - Consider logging admin actions
5. **Role Hierarchy** - Super Admin should be limited to trusted users only

## Migration from ADMIN_EMAILS

If you previously used the `ADMIN_EMAILS` environment variable:

1. **Identify admin users** from your `.env` file
2. **Add them to database** using the SQL commands above
3. **Remove environment variables**:
   - `ADMIN_EMAILS`
   - `NEXT_PUBLIC_ADMIN_EMAILS`
4. **Deploy the updated code**
5. **Verify** all admins can still access the admin panel

## Future Enhancements

Potential improvements to the admin system:

1. **Admin UI for user management** - Create/edit/delete admins through web interface
2. **Audit logging** - Track all admin actions in a separate table
3. **Custom roles** - Allow creating roles through the UI
4. **Permission inheritance** - Role hierarchy with inherited permissions
5. **Two-factor authentication** - Additional security for admin accounts
6. **Session management** - View and revoke active admin sessions
7. **Rate limiting** - Prevent brute force attacks on admin endpoints

## API Reference

### `requireAdmin(request: NextRequest)`

**Returns:**
```typescript
{
  user: User | null,           // Authenticated user from Supabase
  adminUser: AdminUser | null, // Admin user with role data
  response: NextResponse | null, // Error response (401/403) if not admin
  supabase: SupabaseClient     // Service role client
}
```

**Usage:**
```typescript
const { user, adminUser, response, supabase } = await requireAdmin(request);
if (response) return response;
// Continue with admin logic
```

### `checkAdminAccess(request: NextRequest)`

**Returns:**
```typescript
{
  user: User | null,
  isAdmin: boolean,
  adminUser: { user_id: string, role_id: string } | null,
  error: string | null,
  status: number
}
```

**Usage:**
```typescript
const authCheck = await checkAdminAccess(request);
if (authCheck.error) {
  return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
}
// Continue with admin logic
```

### `hasPermission(adminUser: AdminUser, permission: string)`

**Returns:** `boolean`

**Usage:**
```typescript
if (hasPermission(adminUser, 'content:write')) {
  // Allow content modification
}
```

## Conclusion

This admin system provides a robust, database-driven approach to access control. By removing environment variable dependencies and implementing proper RLS, we ensure:

- **Scalability** - Easy to add/remove admins
- **Security** - No hardcoded credentials
- **Flexibility** - Role-based permissions
- **Auditability** - Database logs all admin access
- **Maintainability** - Clear separation of concerns

For deployment instructions, see `DEPLOYMENT_INSTRUCTIONS.md`.
