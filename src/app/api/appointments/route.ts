import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { bookAppointmentSchema } from "@/lib/validations";
import { generateAppointmentCode } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { createInAppNotification, sendNotificationSMS } from "@/lib/notifications";
import { sendSMS, appointmentBookedSMS } from "@/lib/sms";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = bookAppointmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Find or create visitor
    let visitor = await prisma.visitor.findFirst({
      where: { phone: data.phone },
    });

    if (!visitor) {
      visitor = await prisma.visitor.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          phone: data.phone,
          company: data.company || null,
        },
      });
    }

    // Create appointment
    const appointmentCode = generateAppointmentCode();
    const appointmentDate = new Date(data.date);
    const [startHour, startMin] = data.startTime.split(":").map(Number);
    const [endHour, endMin] = data.endTime.split(":").map(Number);

    const startTime = new Date(appointmentDate);
    startTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date(appointmentDate);
    endTime.setHours(endHour, endMin, 0, 0);

    const appointment = await prisma.appointment.create({
      data: {
        appointmentCode,
        visitorId: visitor.id,
        recipientId: data.recipientId,
        departmentId: data.departmentId || null,
        branchId: data.branchId || null,
        purpose: data.purpose,
        date: appointmentDate,
        startTime,
        endTime,
        notes: data.notes || null,
        status: "PENDING",
      },
    });

    // Get recipient details for SMS
    const recipient = await prisma.user.findUnique({
      where: { id: data.recipientId },
      select: { firstName: true, lastName: true, phone: true },
    });

    // Notify recipient (in-app)
    await createInAppNotification(
      data.recipientId,
      "New Appointment Request",
      `${data.firstName} ${data.lastName} has requested an appointment on ${data.date} at ${data.startTime}.`,
      `/dashboard/staff/appointments`
    );

    // SMS to visitor (booking confirmation)
    if (data.phone) {
      const smsMsg = appointmentBookedSMS({
        visitorName: `${data.firstName} ${data.lastName}`,
        appointmentCode,
        date: data.date,
        time: data.startTime,
        recipientName: recipient ? `${recipient.firstName} ${recipient.lastName}` : "Staff",
      });
      sendSMS({ to: data.phone, message: smsMsg }).catch(() => {});
    }

    // SMS to recipient (new appointment alert)
    if (recipient?.phone) {
      sendNotificationSMS(
        data.recipientId,
        `New appointment request from ${data.firstName} ${data.lastName} on ${data.date} at ${data.startTime}. Check your dashboard. - VisitFlow`
      ).catch(() => {});
    }

    // Audit log
    await createAuditLog({
      action: "CREATE",
      entity: "Appointment",
      entityId: appointment.id,
      newValues: { appointmentCode, visitorName: `${data.firstName} ${data.lastName}` },
    });

    return NextResponse.json({
      id: appointment.id,
      appointmentCode: appointment.appointmentCode,
      qrCodeToken: appointment.qrCodeToken,
      status: appointment.status,
    }, { status: 201 });
  } catch (error) {
    console.error("Appointment creation failed:", error);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const where: Record<string, unknown> = {};

    if (["STAFF", "DEPARTMENT_HEAD"].includes(session.user.role)) {
      where.recipientId = session.user.id;
    }

    if (status) {
      where.status = status;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          visitor: true,
          recipient: { select: { id: true, firstName: true, lastName: true } },
          department: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({
      appointments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Failed to fetch appointments:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}
