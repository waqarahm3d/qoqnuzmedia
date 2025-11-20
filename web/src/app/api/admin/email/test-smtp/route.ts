import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { testSMTPConnection } from '@/lib/email/email-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/email/test-smtp
 * Test SMTP connection
 */
export async function POST(request: NextRequest) {
  const { user, adminUser, response } = await requireAdmin(request);
  if (response) return response;

  try {
    const result = await testSMTPConnection();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('SMTP test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to test SMTP connection',
      },
      { status: 500 }
    );
  }
}
