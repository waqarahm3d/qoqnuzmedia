import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/featured-sections
 * Get all active featured sections with their items (public)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get all active featured sections
    const { data: sections, error: sectionsError } = await supabase
      .from('featured_sections')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (sectionsError) throw sectionsError;

    // For each section, get its items with full details
    const sectionsWithItems = await Promise.all(
      (sections || []).map(async (section) => {
        const { data: items } = await supabase
          .from('featured_items')
          .select('*')
          .eq('section_id', section.id)
          .order('display_order', { ascending: true });

        // Fetch full details for each item based on section type
        let itemsWithDetails: any[] = [];

        if (items && items.length > 0) {
          if (section.section_type === 'tracks') {
            const itemIds = items.map(i => i.item_id);
            const { data: tracks } = await supabase
              .from('tracks')
              .select(`
                id,
                title,
                duration_ms,
                cover_art_url,
                play_count,
                artist_id,
                album_id,
                artists!tracks_artist_id_fkey(id, name, avatar_url),
                albums!tracks_album_id_fkey(id, title, cover_art_url)
              `)
              .in('id', itemIds);

            itemsWithDetails = items.map(item => ({
              ...item,
              details: tracks?.find(t => t.id === item.item_id)
            }));
          } else if (section.section_type === 'albums') {
            const itemIds = items.map(i => i.item_id);
            const { data: albums } = await supabase
              .from('albums')
              .select(`
                id,
                title,
                cover_art_url,
                release_date,
                artist_id,
                artists!albums_artist_id_fkey(id, name)
              `)
              .in('id', itemIds);

            itemsWithDetails = items.map(item => ({
              ...item,
              details: albums?.find(a => a.id === item.item_id)
            }));
          } else if (section.section_type === 'artists') {
            const itemIds = items.map(i => i.item_id);
            const { data: artists } = await supabase
              .from('artists')
              .select('id, name, avatar_url, verified')
              .in('id', itemIds);

            itemsWithDetails = items.map(item => ({
              ...item,
              details: artists?.find(a => a.id === item.item_id)
            }));
          }
        }

        return {
          ...section,
          items: itemsWithDetails
        };
      })
    );

    return NextResponse.json({ sections: sectionsWithItems });
  } catch (error: any) {
    console.error('Get featured sections error:', error);
    return NextResponse.json(
      { error: 'Failed to get featured sections', details: error.message },
      { status: 500 }
    );
  }
}
