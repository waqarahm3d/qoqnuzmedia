import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { sendBulkEmails } from '@/lib/email/email-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for bulk sending

/**
 * POST /api/admin/email/send-bulk
 * Send bulk email to all users or specific recipients
 */
export async function POST(request: NextRequest) {
  const { user, adminUser, response, supabase } = await requireAdmin(request);
  if (response) return response;

  try {
    const body = await request.json();
    const { subject, html, recipients, campaignName } = body;

    if (!subject || !html) {
      return NextResponse.json(
        { error: 'Subject and HTML content are required' },
        { status: 400 }
      );
    }

    let emailList: string[] = [];

    if (recipients && Array.isArray(recipients)) {
      // Use provided recipient list
      emailList = recipients.filter((email: string) => email && email.includes('@'));
    } else {
      // Get all user emails
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('email')
        .not('email', 'is', null);

      if (usersError) throw usersError;

      emailList = users
        .map((u: any) => u.email)
        .filter((email: string) => email && email.includes('@'));
    }

    if (emailList.length === 0) {
      return NextResponse.json(
        { error: 'No valid email recipients found' },
        { status: 400 }
      );
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .insert({
        name: campaignName || `Bulk Email - ${new Date().toISOString()}`,
        subject,
        html_content: html,
        status: 'sending',
        total_recipients: emailList.length,
        created_by: user.id,
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    // Send emails in background (would be better with a job queue)
    const sendPromise = sendBulkEmails(emailList, subject, html)
      .then(async (result) => {
        // Update campaign status
        await supabase
          .from('email_campaigns')
          .update({
            status: 'sent',
            sent_count: result.sent,
            failed_count: result.failed,
            completed_at: new Date().toISOString(),
          })
          .eq('id', campaign.id);

        return result;
      })
      .catch(async (error) => {
        // Update campaign as failed
        await supabase
          .from('email_campaigns')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', campaign.id);

        throw error;
      });

    // Don't wait for emails to finish sending, return immediately
    // In production, you'd use a job queue (Bull, BullMQ, etc.)

    return NextResponse.json({
      message: 'Email campaign started',
      campaignId: campaign.id,
      totalRecipients: emailList.length,
      status: 'sending',
    });
  } catch (error: any) {
    console.error('Bulk email error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send bulk emails' },
      { status: 500 }
    );
  }
}
