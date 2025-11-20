/**
 * Email Templates for Transactional Emails
 * All templates use responsive HTML design
 */

export interface BaseTemplateData {
  siteName: string;
  siteUrl: string;
  primaryColor?: string;
}

export interface WelcomeEmailData extends BaseTemplateData {
  userName: string;
  verificationUrl?: string;
}

export interface PasswordResetEmailData extends BaseTemplateData {
  userName: string;
  resetUrl: string;
  expiresIn?: string;
}

export interface OTPEmailData extends BaseTemplateData {
  userName: string;
  otpCode: string;
  expiresIn?: string;
}

export interface AccountVerificationEmailData extends BaseTemplateData {
  userName: string;
  verificationUrl: string;
}

export interface AnnouncementEmailData extends BaseTemplateData {
  title: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
}

/**
 * Base HTML template with consistent styling
 */
function baseTemplate(content: string, data: BaseTemplateData): string {
  const primaryColor = data.primaryColor || '#ff4a14';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.siteName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: ${primaryColor};
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #666666;
    }
    .footer a {
      color: ${primaryColor};
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .header {
        padding: 30px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎵 ${data.siteName}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This email was sent by ${data.siteName}</p>
      <p>
        <a href="${data.siteUrl}">Visit our website</a> |
        <a href="${data.siteUrl}/help">Help Center</a>
      </p>
      <p style="margin-top: 20px; font-size: 12px; color: #999999;">
        If you didn't request this email, you can safely ignore it.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Welcome Email Template
 */
export function welcomeEmail(data: WelcomeEmailData): string {
  const content = `
    <h2 style="margin-top: 0; color: #1a1a1a;">Welcome to ${data.siteName}! 🎉</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Hi ${data.userName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Thank you for joining ${data.siteName}! We're excited to have you as part of our music community.
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Start exploring millions of songs, create playlists, and discover new music today.
    </p>
    ${
      data.verificationUrl
        ? `
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      To get started, please verify your email address:
    </p>
    <p style="text-align: center;">
      <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
    </p>
    `
        : ''
    }
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Happy listening! 🎧
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      The ${data.siteName} Team
    </p>
  `;

  return baseTemplate(content, data);
}

/**
 * Password Reset Email Template
 */
export function passwordResetEmail(data: PasswordResetEmailData): string {
  const content = `
    <h2 style="margin-top: 0; color: #1a1a1a;">Password Reset Request</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Hi ${data.userName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      We received a request to reset your password for your ${data.siteName} account.
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Click the button below to reset your password:
    </p>
    <p style="text-align: center;">
      <a href="${data.resetUrl}" class="button">Reset Password</a>
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #666666; background-color: #f9f9f9; padding: 15px; border-left: 4px solid ${data.primaryColor || '#ff4a14'};">
      <strong>Security Note:</strong> This link will expire in ${data.expiresIn || '1 hour'}. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Best regards,<br>
      The ${data.siteName} Team
    </p>
  `;

  return baseTemplate(content, data);
}

/**
 * One-Time Password (OTP) Email Template
 */
export function otpEmail(data: OTPEmailData): string {
  const content = `
    <h2 style="margin-top: 0; color: #1a1a1a;">Your Verification Code</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Hi ${data.userName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Here's your one-time verification code for ${data.siteName}:
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background-color: #f5f5f5; padding: 20px 40px; border-radius: 8px; border: 2px solid #e0e0e0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a; font-family: 'Courier New', monospace;">
          ${data.otpCode}
        </span>
      </div>
    </div>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Enter this code to complete your verification. This code will expire in ${data.expiresIn || '10 minutes'}.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #666666; background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; border-radius: 4px;">
      <strong>⚠️ Security Warning:</strong> Never share this code with anyone. ${data.siteName} will never ask for this code.
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Best regards,<br>
      The ${data.siteName} Team
    </p>
  `;

  return baseTemplate(content, data);
}

/**
 * Account Verification Email Template
 */
export function accountVerificationEmail(data: AccountVerificationEmailData): string {
  const content = `
    <h2 style="margin-top: 0; color: #1a1a1a;">Verify Your Email Address</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Hi ${data.userName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Thank you for signing up for ${data.siteName}! To complete your registration, please verify your email address.
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Click the button below to verify your email:
    </p>
    <p style="text-align: center;">
      <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #666666;">
      Or copy and paste this link into your browser:
    </p>
    <p style="font-size: 13px; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
      ${data.verificationUrl}
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Once verified, you'll have full access to all ${data.siteName} features.
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">
      Best regards,<br>
      The ${data.siteName} Team
    </p>
  `;

  return baseTemplate(content, data);
}

/**
 * Announcement/Newsletter Email Template
 */
export function announcementEmail(data: AnnouncementEmailData): string {
  const content = `
    <h2 style="margin-top: 0; color: #1a1a1a;">${data.title}</h2>
    <div style="font-size: 16px; line-height: 1.6; color: #333333;">
      ${data.content}
    </div>
    ${
      data.buttonText && data.buttonUrl
        ? `
    <p style="text-align: center; margin-top: 30px;">
      <a href="${data.buttonUrl}" class="button">${data.buttonText}</a>
    </p>
    `
        : ''
    }
    <p style="font-size: 16px; line-height: 1.6; color: #333333; margin-top: 30px;">
      Best regards,<br>
      The ${data.siteName} Team
    </p>
  `;

  return baseTemplate(content, data);
}

/**
 * Generic Email Template
 */
export function genericEmail(
  subject: string,
  content: string,
  data: BaseTemplateData
): string {
  return baseTemplate(content, data);
}
