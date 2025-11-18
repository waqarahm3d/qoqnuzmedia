import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { apiSuccess, apiError, apiServerError, apiValidationError } from '@/lib/api-response';

interface RouteParams {
  params: {
    playlistId: string;
  };
}

/**
 * GET /api/playlists/[playlistId]/collaborators
 * Get all collaborators for a playlist
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { playlistId } = params;

  try {
    // Check if user owns playlist or is a collaborator
    const { data: playlist } = await supabase
      .from('playlists')
      .select('user_id')
      .eq('id', playlistId)
      .single();

    if (!playlist) {
      return apiError('Playlist not found', 404);
    }

    const isOwner = playlist.user_id === user.id;

    if (!isOwner) {
      // Check if user is a collaborator
      const { data: collab } = await supabase
        .from('playlist_collaborators')
        .select('*')
        .eq('playlist_id', playlistId)
        .eq('user_id', user.id)
        .single();

      if (!collab) {
        return apiError('Not authorized to view collaborators', 403);
      }
    }

    // Get all collaborators
    const { data: collaborators, error } = await supabase
      .from('playlist_collaborators')
      .select(`
        *,
        user:user_id (
          id,
          email,
          raw_user_meta_data
        ),
        invited_by_user:invited_by (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('playlist_id', playlistId)
      .order('invited_at', { ascending: false });

    if (error) throw error;

    return apiSuccess({ collaborators: collaborators || [], isOwner });
  } catch (error: any) {
    console.error('Get collaborators error:', error);
    return apiServerError('Failed to fetch collaborators', error);
  }
}

/**
 * POST /api/playlists/[playlistId]/collaborators
 * Invite a collaborator to a playlist
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { playlistId } = params;

  try {
    const body = await request.json();
    const { user_id, email, permission = 'edit' } = body;

    if (!user_id && !email) {
      return apiValidationError('user_id or email is required');
    }

    if (permission && !['view', 'edit', 'admin'].includes(permission)) {
      return apiValidationError('Invalid permission. Must be view, edit, or admin');
    }

    // Check if user owns the playlist
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('user_id')
      .eq('id', playlistId)
      .single();

    if (playlistError || !playlist) {
      return apiError('Playlist not found', 404);
    }

    if (playlist.user_id !== user.id) {
      return apiError('Only playlist owner can add collaborators', 403);
    }

    // Find user by email if user_id not provided
    let targetUserId = user_id;
    if (!targetUserId && email) {
      const { data: targetUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!targetUser) {
        return apiError('User not found with that email', 404);
      }
      targetUserId = targetUser.id;
    }

    // Check if already a collaborator
    const { data: existing } = await supabase
      .from('playlist_collaborators')
      .select('id')
      .eq('playlist_id', playlistId)
      .eq('user_id', targetUserId)
      .single();

    if (existing) {
      return apiError('User is already a collaborator', 400);
    }

    // Create collaborator invite
    const { data: collaborator, error: createError } = await supabase
      .from('playlist_collaborators')
      .insert({
        playlist_id: playlistId,
        user_id: targetUserId,
        permission,
        invited_by: user.id,
        status: 'pending',
      })
      .select(`
        *,
        user:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .single();

    if (createError) throw createError;

    // TODO: Send notification to invited user

    return apiSuccess({ collaborator }, 201);
  } catch (error: any) {
    console.error('Add collaborator error:', error);
    return apiServerError('Failed to add collaborator', error);
  }
}

/**
 * PATCH /api/playlists/[playlistId]/collaborators
 * Update collaborator permission or accept/reject invite
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { playlistId } = params;

  try {
    const body = await request.json();
    const { collaborator_id, permission, status } = body;

    if (!collaborator_id) {
      return apiValidationError('collaborator_id is required');
    }

    // Get collaborator record
    const { data: collaborator, error: collabError } = await supabase
      .from('playlist_collaborators')
      .select('*, playlists!inner(user_id)')
      .eq('id', collaborator_id)
      .eq('playlist_id', playlistId)
      .single();

    if (collabError || !collaborator) {
      return apiError('Collaborator not found', 404);
    }

    const isOwner = collaborator.playlists.user_id === user.id;
    const isTargetUser = collaborator.user_id === user.id;

    // Check permissions
    if (status) {
      // User accepting/rejecting invite
      if (!isTargetUser) {
        return apiError('Only invited user can accept/reject invite', 403);
      }

      const updateData: any = { status };
      if (status === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('playlist_collaborators')
        .update(updateData)
        .eq('id', collaborator_id)
        .select()
        .single();

      if (error) throw error;

      return apiSuccess({ collaborator: data });
    }

    if (permission) {
      // Owner updating permissions
      if (!isOwner) {
        return apiError('Only playlist owner can update permissions', 403);
      }

      const { data, error } = await supabase
        .from('playlist_collaborators')
        .update({ permission })
        .eq('id', collaborator_id)
        .select()
        .single();

      if (error) throw error;

      return apiSuccess({ collaborator: data });
    }

    return apiValidationError('No updates provided');
  } catch (error: any) {
    console.error('Update collaborator error:', error);
    return apiServerError('Failed to update collaborator', error);
  }
}

/**
 * DELETE /api/playlists/[playlistId]/collaborators
 * Remove a collaborator from a playlist
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { user, response, supabase } = await requireAuth(request);
  if (response) return response;

  const { playlistId } = params;
  const { searchParams } = new URL(request.url);
  const collaboratorId = searchParams.get('collaborator_id');

  if (!collaboratorId) {
    return apiValidationError('collaborator_id query parameter is required');
  }

  try {
    // Get collaborator and playlist info
    const { data: collaborator, error: collabError } = await supabase
      .from('playlist_collaborators')
      .select('*, playlists!inner(user_id)')
      .eq('id', collaboratorId)
      .eq('playlist_id', playlistId)
      .single();

    if (collabError || !collaborator) {
      return apiError('Collaborator not found', 404);
    }

    const isOwner = collaborator.playlists.user_id === user.id;
    const isTargetUser = collaborator.user_id === user.id;

    // Only owner or the collaborator themselves can remove
    if (!isOwner && !isTargetUser) {
      return apiError('Not authorized to remove this collaborator', 403);
    }

    const { error: deleteError } = await supabase
      .from('playlist_collaborators')
      .delete()
      .eq('id', collaboratorId);

    if (deleteError) throw deleteError;

    return apiSuccess({ success: true, message: 'Collaborator removed' });
  } catch (error: any) {
    console.error('Remove collaborator error:', error);
    return apiServerError('Failed to remove collaborator', error);
  }
}
