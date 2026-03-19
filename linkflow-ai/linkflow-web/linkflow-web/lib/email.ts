/**
 * LinkFlow AI — Email notifications via Resend
 * Sends transactional emails: 2FA alerts, success receipts, failure notices.
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = 'LinkFlow AI <noreply@linkflow.ai>';

// ── 2FA Required ─────────────────────────────────────────────────────────────
export async function send2FAAlert(params: {
  toEmail: string;
  toName: string;
  taskId: string;
  platformName: string;
  promptMessage: string;
  dashboardUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.toEmail,
    subject: `Action Required: 2FA needed for your LinkFlow task`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: system-ui, sans-serif; background: #0B0F1A; color: #E2E8F0; margin: 0; padding: 24px;">
          <div style="max-width: 560px; margin: 0 auto;">
            <div style="background: #141925; border: 1px solid #1A2540; border-radius: 12px; padding: 32px;">
              <h2 style="color: #00D4FF; margin-top: 0;">⚡ Action Required — 2FA Detected</h2>
              <p>Hi ${params.toName},</p>
              <p>Your LinkFlow task encountered a <strong>Two-Factor Authentication</strong> prompt on <strong>${params.platformName}</strong>.</p>
              <div style="background: #0B0F1A; border-left: 3px solid #00D4FF; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-family: monospace; font-size: 13px;">
                ${params.promptMessage}
              </div>
              <p>Please visit your dashboard to enter the code:</p>
              <a href="${params.dashboardUrl}/tasks/${params.taskId}" style="display: inline-block; background: #00D4FF; color: #0B0F1A; font-weight: 700; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 8px;">Enter 2FA Code →</a>
              <p style="margin-top: 24px; font-size: 12px; color: #64748B;">Task ID: ${params.taskId}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

// ── Task Success ──────────────────────────────────────────────────────────────
export async function sendSuccessEmail(params: {
  toEmail: string;
  toName: string;
  taskId: string;
  platformName: string;
  liveUrl: string;
  screenshotUrl: string;
  dashboardUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.toEmail,
    subject: `✓ Backlink submitted — ${params.platformName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: system-ui, sans-serif; background: #0B0F1A; color: #E2E8F0; margin: 0; padding: 24px;">
          <div style="max-width: 560px; margin: 0 auto;">
            <div style="background: #141925; border: 1px solid #1A2540; border-radius: 12px; padding: 32px;">
              <h2 style="color: #22C55E; margin-top: 0;">✓ Backlink Successfully Submitted</h2>
              <p>Hi ${params.toName},</p>
              <p>Your backlink has been posted to <strong>${params.platformName}</strong>.</p>
              <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #1A2540; color: #94A3B8;">Live URL</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #1A2540;"><a href="${params.liveUrl}" style="color: #00D4FF;">${params.liveUrl}</a></td></tr>
              </table>
              ${params.screenshotUrl ? `<img src="${params.screenshotUrl}" alt="Proof screenshot" style="width:100%; border-radius: 8px; border: 1px solid #1A2540; margin-top: 8px;">` : ''}
              <a href="${params.dashboardUrl}" style="display: inline-block; background: #22C55E; color: #0B0F1A; font-weight: 700; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">View Dashboard →</a>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

// ── Task Failed ───────────────────────────────────────────────────────────────
export async function sendFailureEmail(params: {
  toEmail: string;
  toName: string;
  taskId: string;
  platformName: string;
  errorMessage: string;
  dashboardUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.toEmail,
    subject: `Task failed — credit refunded`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: system-ui, sans-serif; background: #0B0F1A; color: #E2E8F0; margin: 0; padding: 24px;">
          <div style="max-width: 560px; margin: 0 auto;">
            <div style="background: #141925; border: 1px solid #1A2540; border-radius: 12px; padding: 32px;">
              <h2 style="color: #EF4444; margin-top: 0;">✗ Task Failed — Credit Refunded</h2>
              <p>Hi ${params.toName},</p>
              <p>Unfortunately your task on <strong>${params.platformName}</strong> failed after all retry attempts. Your credit has been refunded.</p>
              <div style="background: #0B0F1A; border-left: 3px solid #EF4444; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-family: monospace; font-size: 12px;">
                ${params.errorMessage}
              </div>
              <a href="${params.dashboardUrl}" style="display: inline-block; background: #3B82F6; color: #fff; font-weight: 700; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 8px;">Try Again →</a>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}


