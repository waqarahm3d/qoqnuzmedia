import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/auth/admin-middleware';
import { uploadToR2 } from '@/lib/r2';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/genres
 * Get all genres with pagination
 */
export async function GET(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('genres')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: genres, error, count } = await query
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      genres: genres || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Get genres error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch genres', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/genres
 * Create a new genre with optional image upload
 */
export async function POST(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  // Note: Removed strict permission check for now - all admins can create genres

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;
    const display_order = formData.get('display_order') as string;
    const imageFile = formData.get('image') as File | null;

    if (!name) {
      return NextResponse.json(
        { error: 'Genre name is required' },
        { status: 400 }
      );
    }

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Upload image if provided
    let image_url = null;
    if (imageFile && imageFile.size > 0) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validImageTypes.includes(imageFile.type)) {
        return NextResponse.json(
          { error: 'Invalid image file type. Use JPG, PNG, or WebP' },
          { status: 400 }
        );
      }

      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${slug}-image.${fileExt}`;
      const filePath = `genres/${fileName}`;

      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await uploadToR2(filePath, buffer, imageFile.type);
      image_url = filePath;
    }

    const { data: genre, error } = await supabase
      .from('genres')
      .insert({
        name,
        slug,
        description: description || null,
        image_url,
        color: color || '#ff4a14',
        display_order: display_order ? parseInt(display_order) : 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ genre }, { status: 201 });
  } catch (error: any) {
    console.error('Create genre error:', error);
    return NextResponse.json(
      { error: 'Failed to create genre', details: error.message },
      { status: 500 }
    );
  }
}
