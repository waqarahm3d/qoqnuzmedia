import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/featured-sections
 * Get all featured sections (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all featured sections with item counts
    const { data: sections, error } = await supabase
      .from('featured_sections')
      .select(`
        *,
        featured_items(count)
      `)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ sections: sections || [] });
  } catch (error: any) {
    console.error('Get featured sections error:', error);
    return NextResponse.json(
      { error: 'Failed to get featured sections', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/featured-sections
 * Create a new featured section (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { title, description, section_type, is_active, display_order } = await request.json();

    if (!title || !section_type) {
      return NextResponse.json(
        { error: 'Title and section type are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('featured_sections')
      .insert({
        title,
        description,
        section_type,
        is_active: is_active ?? true,
        display_order: display_order ?? 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ section: data });
  } catch (error: any) {
    console.error('Create featured section error:', error);
    return NextResponse.json(
      { error: 'Failed to create featured section', details: error.message },
      { status: 500 }
    );
  }
}
