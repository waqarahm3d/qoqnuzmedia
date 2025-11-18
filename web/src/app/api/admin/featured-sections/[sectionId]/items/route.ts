import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/featured-sections/[sectionId]/items
 * Get all items in a featured section (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
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
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { sectionId } = params;

    // Get section info first to determine type
    const { data: section } = await supabase
      .from('featured_sections')
      .select('section_type')
      .eq('id', sectionId)
      .single();

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // Get items with details based on section type
    const { data: items, error } = await supabase
      .from('featured_items')
      .select('*')
      .eq('section_id', sectionId)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Fetch details for each item based on type
    const itemsWithDetails = await Promise.all(
      (items || []).map(async (item) => {
        let details = null;

        if (section.section_type === 'tracks') {
          const { data } = await supabase
            .from('tracks')
            .select('id, title, artists!tracks_artist_id_fkey(name), cover_art_url')
            .eq('id', item.item_id)
            .single();
          details = data;
        } else if (section.section_type === 'albums') {
          const { data } = await supabase
            .from('albums')
            .select('id, title, artists!albums_artist_id_fkey(name), cover_art_url')
            .eq('id', item.item_id)
            .single();
          details = data;
        } else if (section.section_type === 'artists') {
          const { data } = await supabase
            .from('artists')
            .select('id, name, avatar_url')
            .eq('id', item.item_id)
            .single();
          details = data;
        }

        return { ...item, details };
      })
    );

    return NextResponse.json({ items: itemsWithDetails });
  } catch (error: any) {
    console.error('Get featured items error:', error);
    return NextResponse.json(
      { error: 'Failed to get featured items', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/featured-sections/[sectionId]/items
 * Add an item to a featured section (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
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
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { sectionId } = params;
    const { item_id, display_order } = await request.json();

    if (!item_id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('featured_items')
      .insert({
        section_id: sectionId,
        item_id,
        display_order: display_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ item: data });
  } catch (error: any) {
    console.error('Add featured item error:', error);
    return NextResponse.json(
      { error: 'Failed to add featured item', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/featured-sections/[sectionId]/items/[itemId]
 * Remove an item from a featured section (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
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
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { itemId } = await request.json();

    const { error } = await supabase
      .from('featured_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    return NextResponse.json({ message: 'Featured item removed' });
  } catch (error: any) {
    console.error('Remove featured item error:', error);
    return NextResponse.json(
      { error: 'Failed to remove featured item', details: error.message },
      { status: 500 }
    );
  }
}
