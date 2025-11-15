import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';

/**
 * GET /api/admin/genres/[genreId]
 * Get genre details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { genreId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { genreId } = params;

  try {
    const { data: genre, error } = await supabase
      .from('genres')
      .select('*')
      .eq('id', genreId)
      .single();

    if (error) throw error;

    if (!genre) {
      return NextResponse.json({ error: 'Genre not found' }, { status: 404 });
    }

    return NextResponse.json({ genre });
  } catch (error: any) {
    console.error('Get genre error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch genre', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/genres/[genreId]
 * Update genre
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { genreId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { genreId } = params;

  try {
    const body = await request.json();
    const { name, description, image_url, color, display_order, is_active } =
      body;

    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
      // Update slug if name changed
      updateData.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) updateData.description = description;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (color !== undefined) updateData.color = color;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: genre, error } = await supabase
      .from('genres')
      .update(updateData)
      .eq('id', genreId)
      .select()
      .single();

    if (error) throw error;

    if (!genre) {
      return NextResponse.json({ error: 'Genre not found' }, { status: 404 });
    }

    return NextResponse.json({ genre });
  } catch (error: any) {
    console.error('Update genre error:', error);
    return NextResponse.json(
      { error: 'Failed to update genre', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/genres/[genreId]
 * Delete genre
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { genreId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { genreId } = params;

  try {
    const { error } = await supabase
      .from('genres')
      .delete()
      .eq('id', genreId);

    if (error) throw error;

    return NextResponse.json({ message: 'Genre deleted successfully' });
  } catch (error: any) {
    console.error('Delete genre error:', error);
    return NextResponse.json(
      { error: 'Failed to delete genre', details: error.message },
      { status: 500 }
    );
  }
}
