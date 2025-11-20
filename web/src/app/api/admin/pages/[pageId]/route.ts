import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pages/[pageId]
 * Get a specific page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const { data: page, error } = await supabase
      .from('custom_pages')
      .select('*')
      .eq('id', params.pageId)
      .single();

    if (error) throw error;

    return NextResponse.json({ page });
  } catch (error: any) {
    console.error('Get page error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/pages/[pageId]
 * Update a custom page
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const body = await request.json();
    const { title, slug, content, meta_description, is_published, display_in_footer, display_order } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (meta_description !== undefined) updateData.meta_description = meta_description;
    if (is_published !== undefined) updateData.is_published = is_published;
    if (display_in_footer !== undefined) updateData.display_in_footer = display_in_footer;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data: page, error } = await supabase
      .from('custom_pages')
      .update(updateData)
      .eq('id', params.pageId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ page });
  } catch (error: any) {
    console.error('Update page error:', error);

    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update page', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/pages/[pageId]
 * Delete a custom page
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const { error } = await supabase
      .from('custom_pages')
      .delete()
      .eq('id', params.pageId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete page error:', error);
    return NextResponse.json(
      { error: 'Failed to delete page', details: error.message },
      { status: 500 }
    );
  }
}
