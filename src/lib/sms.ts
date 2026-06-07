import prisma from "@/lib/prisma";

interface SMSOptions {
  to: string;
  message: string;
}

async function getSMSConfig() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { group: "sms" },
    });
    const config: Record<string, string> = {};
    for (const s of settings) config[s.key] = s.value;
    return {
      apiKey: config.sms_api_key || process.env.MNOTIFY_API_KEY || "",
      senderId: config.sms_sender_id || process.env.MNOTIFY_SENDER_ID || "OpenABV",
      enabled: config.sms_enabled !== "false",
    };
  } catch {
    return {
      apiKey: process.env.MNOTIFY_API_KEY || "",
      senderId: process.env.MNOTIFY_SENDER_ID || "OpenABV",
      enabled: true,
    };
  }
}

export async function sendSMS(options: SMSOptions): Promise<boolean> {
  const config = await getSMSConfig();

  if (!config.enabled) {
    console.log("SMS disabled in settings, skipping");
    return false;
  }

  if (!config.apiKey) {
    console.warn("mNotify API key not configured");
    return false;
  }

  try {
    const response = await fetch(
      `https://apps.mnotify.net/smsapi?key=${config.apiKey}&to=${options.to}&msg=${encodeURIComponent(options.message)}&sender_id=${config.senderId}`,
      { method: "GET" }
    );

    const data = await response.json();
    console.log(`SMS to ${options.to}: status=${data.status}`);
    return data.status === "success";
  } catch (error) {
    console.error("SMS send failed:", error);
    return false;
  }
}

// --- Appointment SMS Templates ---

export function appointmentBookedSMS(data: {
  visitorName: string;
  appointmentCode: string;
  date: string;
  time: string;
  recipientName: string;
}): string {
  return `Hi ${data.visitorName}, your appointment (${data.appointmentCode}) with ${data.recipientName} on ${data.date} at ${data.time} has been submitted. You'll receive a confirmation shortly. - OpenABV`;
}

export function appointmentApprovedSMS(data: {
  visitorName: string;
  appointmentCode: string;
  date: string;
  time: string;
}): string {
  return `Hi ${data.visitorName}, your appointment (${data.appointmentCode}) on ${data.date} at ${data.time} has been APPROVED. Please arrive on time with a valid ID. - OpenABV`;
}

export function appointmentDeclinedSMS(data: {
  visitorName: string;
  appointmentCode: string;
  reason?: string;
}): string {
  const r = data.reason ? ` Reason: ${data.reason}` : "";
  return `Hi ${data.visitorName}, your appointment (${data.appointmentCode}) has been declined.${r} Contact the office for more info. - OpenABV`;
}

export function appointmentRescheduledSMS(data: {
  visitorName: string;
  appointmentCode: string;
  newDate: string;
  newTime: string;
}): string {
  return `Hi ${data.visitorName}, your appointment (${data.appointmentCode}) has been rescheduled to ${data.newDate} at ${data.newTime}. - OpenABV`;
}

export function appointmentReminderSMS(data: {
  visitorName: string;
  appointmentCode: string;
  date: string;
  time: string;
}): string {
  return `Reminder: Hi ${data.visitorName}, your appointment (${data.appointmentCode}) is tomorrow ${data.date} at ${data.time}. Please arrive on time with a valid ID. - OpenABV`;
}

// --- Walk-In SMS Templates ---

export function walkInAlertSMS(data: {
  recipientName: string;
  visitorName: string;
  purpose: string;
}): string {
  return `${data.recipientName}, walk-in visitor ${data.visitorName} is here. Purpose: ${data.purpose}. Check your dashboard to respond. - OpenABV`;
}

export function walkInDecisionSMS(data: {
  visitorName: string;
  decision: string;
  recipientName: string;
  note?: string;
}): string {
  const d = data.decision === "APPROVED"
    ? `${data.recipientName} has approved your visit. Please proceed.`
    : data.decision === "WAIT"
    ? `${data.recipientName} asks you to please wait.`
    : data.decision === "DECLINED"
    ? `${data.recipientName} is not available at this time.`
    : `Your visit has been rescheduled.`;
  const n = data.note ? ` Note: ${data.note}` : "";
  return `Hi ${data.visitorName}, ${d}${n} - OpenABV`;
}

// --- Check-In/Out SMS ---

export function visitorCheckedInSMS(data: {
  recipientName: string;
  visitorName: string;
  purpose: string;
}): string {
  return `${data.recipientName}, your visitor ${data.visitorName} has checked in. Purpose: ${data.purpose}. - OpenABV`;
}

export function visitorCheckedOutSMS(data: {
  visitorName: string;
}): string {
  return `${data.visitorName}, you have been checked out. Thank you for visiting! - OpenABV`;
}
