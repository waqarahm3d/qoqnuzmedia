import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { apiSuccess, apiServerError, apiValidationError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/downloads/whitelist
 * Get all whitelist entries
 */
export async function GET(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const { data: entries, error } = await supabase
      .from('download_whitelist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return apiSuccess({ entries: entries || [] });
  } catch (error: any) {
    console.error('Get whitelist error:', error);
    return apiServerError('Failed to fetch whitelist', error);
  }
}

/**
 * POST /api/admin/downloads/whitelist
 * Add new whitelist entry
 */
export async function POST(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const body = await request.json();
    const { source_type, identifier, name, enabled } = body;

    // Validate required fields
    if (!source_type || !['youtube_channel', 'soundcloud_user'].includes(source_type)) {
      return apiValidationError('Valid source_type is required (youtube_channel or soundcloud_user)');
    }
    if (!identifier) {
      return apiValidationError('Identifier is required');
    }

    const { data: entry, error } = await supabase
      .from('download_whitelist')
      .insert({
        source_type,
        identifier,
        name: name || identifier,
        enabled: enabled !== undefined ? enabled : true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return apiValidationError('This entry already exists in the whitelist');
      }
      throw error;
    }

    return apiSuccess({ entry }, 201);
  } catch (error: any) {
    console.error('Create whitelist entry error:', error);
    return apiServerError('Failed to create whitelist entry', error);
  }
}

/**
 * DELETE /api/admin/downloads/whitelist
 * Remove whitelist entry
 */
export async function DELETE(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return apiValidationError('Entry ID is required');
  }

  try {
    const { error } = await supabase
      .from('download_whitelist')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return apiSuccess({ success: true, message: 'Whitelist entry deleted' });
  } catch (error: any) {
    console.error('Delete whitelist entry error:', error);
    return apiServerError('Failed to delete whitelist entry', error);
  }
}
