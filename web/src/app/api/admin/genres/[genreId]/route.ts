import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';
import { uploadToR2 } from '@/lib/r2';

export const dynamic = 'force-dynamic';

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
 * Update genre with optional image upload
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { genreId: string } }
) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { genreId } = params;

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;
    const display_order = formData.get('display_order') as string;
    const is_active = formData.get('is_active') as string;
    const imageFile = formData.get('image') as File | null;

    const updateData: any = {};
    if (name !== undefined && name !== '') {
      updateData.name = name;
      // Update slug if name changed
      updateData.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (display_order !== undefined) updateData.display_order = parseInt(display_order);
    if (is_active !== undefined) updateData.is_active = is_active === 'true';

    // Upload image if provided
    if (imageFile && imageFile.size > 0) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validImageTypes.includes(imageFile.type)) {
        return NextResponse.json(
          { error: 'Invalid image file type. Use JPG, PNG, or WebP' },
          { status: 400 }
        );
      }

      const slug = updateData.slug || name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${slug}-image.${fileExt}`;
      const filePath = `genres/${fileName}`;

      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await uploadToR2(filePath, buffer, imageFile.type);
      updateData.image_url = filePath;
    }

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
