import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSMS, appointmentReminderSMS } from "@/lib/sms";

export async function POST(request: NextRequest) {
  // Verify cron secret or admin auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: tomorrow, lt: dayAfter },
        status: "APPROVED",
      },
      include: {
        visitor: true,
        recipient: { select: { firstName: true, lastName: true } },
      },
    });

    let sent = 0;
    for (const apt of appointments) {
      if (!apt.visitor.phone) continue;

      const smsMsg = appointmentReminderSMS({
        visitorName: `${apt.visitor.firstName}`,
        appointmentCode: apt.appointmentCode,
        date: new Date(apt.date).toLocaleDateString(),
        time: new Date(apt.startTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      const ok = await sendSMS({ to: apt.visitor.phone, message: smsMsg });
      if (ok) sent++;
    }

    return NextResponse.json({
      success: true,
      total: appointments.length,
      sent,
    });
  } catch (error) {
    console.error("Reminder send failed:", error);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
