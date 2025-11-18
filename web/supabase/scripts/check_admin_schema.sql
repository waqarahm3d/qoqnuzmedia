-- Check existing admin_users table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'admin_users'
ORDER BY ordinal_position;

-- Check if there's an admin_roles table
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_roles'
ORDER BY ordinal_position;

-- Check existing roles
SELECT * FROM admin_roles;

-- Check existing admin users
SELECT
    au.*,
    ar.name as role_name,
    u.email
FROM admin_users au
LEFT JOIN admin_roles ar ON ar.id = au.role_id
LEFT JOIN auth.users u ON u.id = au.user_id;
