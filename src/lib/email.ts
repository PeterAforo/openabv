import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

async function getEmailConfig() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { group: "email" },
    });
    const config: Record<string, string> = {};
    for (const s of settings) config[s.key] = s.value;
    return {
      host: config.smtp_host || process.env.SMTP_HOST || "",
      port: Number(config.smtp_port || process.env.SMTP_PORT) || 587,
      user: config.smtp_user || process.env.SMTP_USER || "",
      pass: config.smtp_pass || process.env.SMTP_PASS || "",
      from: config.email_from || process.env.EMAIL_FROM || "noreply@visitflow.io",
      enabled: config.email_enabled !== "false",
    };
  } catch {
    return {
      host: process.env.SMTP_HOST || "",
      port: Number(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
      from: process.env.EMAIL_FROM || "noreply@visitflow.io",
      enabled: true,
    };
  }
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const config = await getEmailConfig();

  if (!config.enabled) {
    console.log("Email disabled in settings, skipping");
    return false;
  }

  if (!config.host || !config.user) {
    console.warn("SMTP not configured");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    });

    await transporter.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}

export function appointmentConfirmationEmail(data: {
  visitorName: string;
  appointmentCode: string;
  date: string;
  time: string;
  recipientName: string;
  purpose: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0A2540; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; color: #00C48C;">VisitFlow</h1>
        <p style="margin: 5px 0 0;">Smart Appointments. Secure Access.</p>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <h2>Appointment Confirmation</h2>
        <p>Dear ${data.visitorName},</p>
        <p>Your appointment has been booked successfully.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Reference Code:</strong> ${data.appointmentCode}</p>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.time}</p>
          <p><strong>Meeting With:</strong> ${data.recipientName}</p>
          <p><strong>Purpose:</strong> ${data.purpose}</p>
        </div>
        <p>Please keep your reference code safe. You will need it when you arrive.</p>
        <p style="color: #6b7280; font-size: 12px;">This is an automated message from VisitFlow.</p>
      </div>
    </div>
  `;
}

export function appointmentApprovedEmail(data: {
  visitorName: string;
  appointmentCode: string;
  date: string;
  time: string;
  recipientName: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #059669; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Appointment Approved</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <p>Dear ${data.visitorName},</p>
        <p>Your appointment (${data.appointmentCode}) has been <strong>approved</strong>.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.time}</p>
          <p><strong>Meeting With:</strong> ${data.recipientName}</p>
        </div>
        <p>Please arrive on time with a valid ID.</p>
      </div>
    </div>
  `;
}

export function walkInNotificationEmail(data: {
  recipientName: string;
  visitorName: string;
  purpose: string;
  company?: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #d97706; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Walk-In Visitor</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <p>Dear ${data.recipientName},</p>
        <p>A walk-in visitor is requesting to see you:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Visitor:</strong> ${data.visitorName}</p>
          ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ""}
          <p><strong>Purpose:</strong> ${data.purpose}</p>
        </div>
        <p>Please log in to your dashboard to approve or decline this request.</p>
      </div>
    </div>
  `;
}
