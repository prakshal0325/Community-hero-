import nodemailer from 'nodemailer';
import env from '../config/env.js';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT),
        secure: parseInt(env.SMTP_PORT) === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    } else {
      console.log('📧 SMTP not configured — emails will be logged to console');
    }
  }

  private baseTemplate(title: string, body: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#9333ea);line-height:48px;text-align:center;">
        <span style="color:#fff;font-size:24px;">🦸</span>
      </div>
      <h2 style="color:#e2e8f0;margin:12px 0 0;font-size:20px;">Community Hero</h2>
    </div>
    <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:32px;color:#e2e8f0;">
      <h3 style="margin:0 0 16px;color:#fff;font-size:18px;">${title}</h3>
      ${body}
    </div>
    <p style="text-align:center;color:#6b7280;font-size:12px;margin-top:24px;">
      © ${new Date().getFullYear()} Community Hero • AI-Powered Hyperlocal Problem Solver
    </p>
  </div>
</body>
</html>`;
  }

  async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"Community Hero" <${env.EMAIL_FROM}>`,
          to,
          subject,
          html,
        });
        return true;
      } catch (error) {
        console.error('📧 Email send failed:', error);
        return false;
      }
    } else {
      console.log(`📧 [DEV EMAIL] To: ${to} | Subject: ${subject}`);
      return true;
    }
  }

  async sendOTPEmail(to: string, name: string, otp: string): Promise<boolean> {
    const html = this.baseTemplate('Your Verification Code', `
      <p style="color:#9ca3af;margin:0 0 24px;line-height:1.6;">
        Hi <strong style="color:#fff;">${name}</strong>, use the following code to verify your identity. This code expires in <strong style="color:#fff;">10 minutes</strong>.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed22,#9333ea22);border:2px solid #7c3aed44;border-radius:12px;padding:16px 32px;letter-spacing:8px;font-size:32px;font-weight:bold;color:#a78bfa;">
          ${otp}
        </div>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    `);

    return this.sendMail(to, `${otp} — Your Community Hero Verification Code`, html);
  }

  async sendPasswordResetEmail(to: string, name: string, otp: string): Promise<boolean> {
    const html = this.baseTemplate('Password Reset Request', `
      <p style="color:#9ca3af;margin:0 0 24px;line-height:1.6;">
        Hi <strong style="color:#fff;">${name}</strong>, we received a request to reset your password. Use the code below to set a new password. This code expires in <strong style="color:#fff;">10 minutes</strong>.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed22,#9333ea22);border:2px solid #7c3aed44;border-radius:12px;padding:16px 32px;letter-spacing:8px;font-size:32px;font-weight:bold;color:#a78bfa;">
          ${otp}
        </div>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
      </p>
    `);

    return this.sendMail(to, 'Reset Your Community Hero Password', html);
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const html = this.baseTemplate('Welcome to Community Hero! 🎉', `
      <p style="color:#9ca3af;margin:0 0 16px;line-height:1.6;">
        Hi <strong style="color:#fff;">${name}</strong>, welcome to Community Hero! You're now part of a community making real change.
      </p>
      <div style="margin:20px 0;padding:16px;background:#1f2937;border-radius:12px;">
        <p style="color:#a78bfa;font-weight:600;margin:0 0 8px;font-size:14px;">🚀 Get started:</p>
        <ul style="color:#9ca3af;margin:0;padding-left:20px;line-height:2;font-size:14px;">
          <li>Report an issue in your neighborhood</li>
          <li>Verify reports from other citizens</li>
          <li>Earn points and climb the leaderboard</li>
          <li>Track issues until they're resolved</li>
        </ul>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="${env.FRONTEND_URL}/dashboard/citizen" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">
          Open Dashboard →
        </a>
      </div>
    `);

    return this.sendMail(to, 'Welcome to Community Hero! 🦸', html);
  }

  async sendStatusUpdateEmail(
    to: string,
    name: string,
    complaintTitle: string,
    newStatus: string,
    complaintId: string
  ): Promise<boolean> {
    const statusLabel = newStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const html = this.baseTemplate('Complaint Status Updated', `
      <p style="color:#9ca3af;margin:0 0 16px;line-height:1.6;">
        Hi <strong style="color:#fff;">${name}</strong>, the status of your complaint has been updated.
      </p>
      <div style="margin:16px 0;padding:16px;background:#1f2937;border-radius:12px;">
        <p style="color:#9ca3af;font-size:13px;margin:0 0 8px;">Complaint</p>
        <p style="color:#fff;font-weight:600;margin:0 0 12px;">${complaintTitle}</p>
        <p style="color:#9ca3af;font-size:13px;margin:0 0 4px;">New Status</p>
        <span style="display:inline-block;padding:4px 12px;background:#7c3aed33;color:#a78bfa;border-radius:20px;font-size:13px;font-weight:600;">
          ${statusLabel}
        </span>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="${env.FRONTEND_URL}/dashboard/citizen/complaints/${complaintId}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">
          View Complaint →
        </a>
      </div>
    `);

    return this.sendMail(to, `Status Update: ${complaintTitle}`, html);
  }
}

export default new EmailService();
