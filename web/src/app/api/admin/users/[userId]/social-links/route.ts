import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/[userId]/social-links
 * Get user's social links
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { userId } = params;

  try {
    const { data: links, error } = await supabase
      .from('social_links')
      .select('*')
      .eq('entity_type', 'user')
      .eq('entity_id', userId)
      .order('platform');

    if (error) throw error;

    return NextResponse.json({ social_links: links || [] });
  } catch (error: any) {
    console.error('Get social links error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social links', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users/[userId]/social-links
 * Add or update a social link for user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { userId } = params;

  try {
    const body = await request.json();
    const { platform, url, display_name } = body;

    if (!platform || !url) {
      return NextResponse.json(
        { error: 'Platform and URL are required' },
        { status: 400 }
      );
    }

    // Upsert the social link (update if exists, insert if not)
    const { data: link, error } = await supabase
      .from('social_links')
      .upsert({
        entity_type: 'user',
        entity_id: userId,
        platform,
        url,
        display_name: display_name || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'entity_type,entity_id,platform',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: 'Social link saved successfully',
      link,
    });
  } catch (error: any) {
    console.error('Save social link error:', error);
    return NextResponse.json(
      { error: 'Failed to save social link', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[userId]/social-links
 * Bulk update all social links for user
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { userId } = params;

  try {
    const body = await request.json();
    const { social_links } = body;

    if (!Array.isArray(social_links)) {
      return NextResponse.json(
        { error: 'social_links must be an array' },
        { status: 400 }
      );
    }

    // Delete existing links
    await supabase
      .from('social_links')
      .delete()
      .eq('entity_type', 'user')
      .eq('entity_id', userId);

    // Insert new links
    if (social_links.length > 0) {
      const linksToInsert = social_links.map((link: any) => ({
        entity_type: 'user',
        entity_id: userId,
        platform: link.platform,
        url: link.url,
        display_name: link.display_name || null,
      }));

      const { error } = await supabase
        .from('social_links')
        .insert(linksToInsert);

      if (error) throw error;
    }

    // Fetch updated links
    const { data: updatedLinks } = await supabase
      .from('social_links')
      .select('*')
      .eq('entity_type', 'user')
      .eq('entity_id', userId)
      .order('platform');

    return NextResponse.json({
      message: 'Social links updated successfully',
      social_links: updatedLinks || [],
    });
  } catch (error: any) {
    console.error('Update social links error:', error);
    return NextResponse.json(
      { error: 'Failed to update social links', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[userId]/social-links
 * Delete a specific social link
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { userId } = params;

  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform parameter is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('social_links')
      .delete()
      .eq('entity_type', 'user')
      .eq('entity_id', userId)
      .eq('platform', platform);

    if (error) throw error;

    return NextResponse.json({
      message: 'Social link deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete social link error:', error);
    return NextResponse.json(
      { error: 'Failed to delete social link', details: error.message },
      { status: 500 }
    );
  }
}
