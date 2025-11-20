import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

/**
 * Email Service for sending transactional and bulk emails via SMTP
 * Supports Zoho ZeptoMail and other SMTP providers
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface SMTPConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
}

/**
 * Fetch SMTP configuration from database
 */
export async function getSMTPConfig(): Promise<SMTPConfig | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: settings } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', [
        'smtp_enabled',
        'smtp_host',
        'smtp_port',
        'smtp_secure',
        'smtp_username',
        'smtp_password',
        'smtp_from_email',
        'smtp_from_name',
      ]);

    if (!settings || settings.length === 0) {
      console.error('No SMTP settings found in database');
      return null;
    }

    const config: any = {};
    settings.forEach((setting) => {
      config[setting.key.replace('smtp_', '')] = setting.value;
    });

    // Validate required fields
    if (!config.enabled) {
      console.log('SMTP is disabled in settings');
      return null;
    }

    if (!config.host || !config.username || !config.password || !config.from_email) {
      console.error('Missing required SMTP configuration fields');
      return null;
    }

    return {
      enabled: config.enabled,
      host: config.host,
      port: config.port || 587,
      secure: config.secure || false,
      username: config.username,
      password: config.password,
      from_email: config.from_email,
      from_name: config.from_name || 'Qoqnuz Music',
    };
  } catch (error) {
    console.error('Error fetching SMTP config:', error);
    return null;
  }
}

/**
 * Create nodemailer transporter with SMTP configuration
 */
async function createTransporter() {
  const config = await getSMTPConfig();

  if (!config) {
    throw new Error('SMTP is not configured or disabled');
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
    // Additional options for better reliability
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
  });
}

/**
 * Send a single email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const config = await getSMTPConfig();

    if (!config) {
      console.error('Cannot send email: SMTP not configured');
      return false;
    }

    const transporter = await createTransporter();

    const mailOptions = {
      from: `"${config.from_name}" <${config.from_email}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
      replyTo: options.replyTo,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    });

    // Log email to database
    await logEmail({
      to: Array.isArray(options.to) ? options.to[0] : options.to,
      subject: options.subject,
      status: 'sent',
      message_id: info.messageId,
    });

    return true;
  } catch (error: any) {
    console.error('Error sending email:', error);

    // Log failed email to database
    await logEmail({
      to: Array.isArray(options.to) ? options.to[0] : options.to,
      subject: options.subject,
      status: 'failed',
      error_message: error.message,
    });

    return false;
  }
}

/**
 * Send bulk emails (for announcements, newsletters)
 * Sends emails in batches to avoid rate limiting
 */
export async function sendBulkEmails(
  recipients: string[],
  subject: string,
  html: string,
  options?: {
    batchSize?: number;
    delayBetweenBatches?: number;
  }
): Promise<{ sent: number; failed: number }> {
  const batchSize = options?.batchSize || 50;
  const delay = options?.delayBetweenBatches || 1000;

  let sent = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    const promises = batch.map((email) =>
      sendEmail({
        to: email,
        subject,
        html,
      })
    );

    const results = await Promise.allSettled(promises);

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        sent++;
      } else {
        failed++;
      }
    });

    // Delay between batches to avoid rate limiting
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return { sent, failed };
}

/**
 * Test SMTP connection
 */
export async function testSMTPConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const transporter = await createTransporter();
    await transporter.verify();

    return {
      success: true,
      message: 'SMTP connection successful',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'SMTP connection failed',
    };
  }
}

/**
 * Log email to database for tracking
 */
async function logEmail(data: {
  to: string;
  subject: string;
  status: 'sent' | 'failed';
  message_id?: string;
  error_message?: string;
}) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.from('email_logs').insert({
      recipient_email: data.to,
      subject: data.subject,
      status: data.status,
      message_id: data.message_id,
      error_message: data.error_message,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging email:', error);
    // Don't throw error, just log it
  }
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}
