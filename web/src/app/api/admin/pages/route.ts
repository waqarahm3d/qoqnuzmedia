import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pages
 * Get all custom pages
 */
export async function GET(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const { data: pages, error } = await supabase
      .from('custom_pages')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ pages: pages || [] });
  } catch (error: any) {
    console.error('Get pages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/pages
 * Create a new custom page
 */
export async function POST(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const body = await request.json();
    const { title, slug, content, meta_description, is_published, display_in_footer, display_order } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      );
    }

    // Create slug from title if not provided
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: page, error } = await supabase
      .from('custom_pages')
      .insert({
        title,
        slug: finalSlug,
        content,
        meta_description,
        is_published: is_published ?? false,
        display_in_footer: display_in_footer ?? true,
        display_order: display_order ?? 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ page });
  } catch (error: any) {
    console.error('Create page error:', error);

    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create page', details: error.message },
      { status: 500 }
    );
  }
}
