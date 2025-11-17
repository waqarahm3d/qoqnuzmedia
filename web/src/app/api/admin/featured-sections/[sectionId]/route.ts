import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * PATCH /api/admin/featured-sections/[sectionId]
 * Update a featured section (admin only)
 */
export async function PATCH(
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
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { sectionId } = params;
    const updateData = await request.json();

    const { data, error } = await supabase
      .from('featured_sections')
      .update(updateData)
      .eq('id', sectionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ section: data });
  } catch (error: any) {
    console.error('Update featured section error:', error);
    return NextResponse.json(
      { error: 'Failed to update featured section', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/featured-sections/[sectionId]
 * Delete a featured section (admin only)
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
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { sectionId } = params;

    const { error } = await supabase
      .from('featured_sections')
      .delete()
      .eq('id', sectionId);

    if (error) throw error;

    return NextResponse.json({ message: 'Featured section deleted' });
  } catch (error: any) {
    console.error('Delete featured section error:', error);
    return NextResponse.json(
      { error: 'Failed to delete featured section', details: error.message },
      { status: 500 }
    );
  }
}
