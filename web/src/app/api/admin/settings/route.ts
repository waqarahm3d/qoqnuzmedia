import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';

/**
 * GET /api/admin/settings
 * Get all site settings
 */
export async function GET(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) throw error;

    // Convert array to object for easier access
    const settingsObject: Record<string, any> = {};
    settings?.forEach((setting) => {
      settingsObject[setting.key] = setting.value;
    });

    return NextResponse.json({ settings: settingsObject });
  } catch (error: any) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings
 * Update site settings
 */
export async function PUT(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  // Check permission
  const permissionError = requirePermission(adminUser, 'settings.edit');
  if (permissionError) return permissionError;

  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    // Update each setting
    const updates = Object.entries(settings).map(([key, value]) =>
      supabase
        .from('site_settings')
        .upsert(
          { key, value },
          { onConflict: 'key' }
        )
    );

    await Promise.all(updates);

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    );
  }
}
