import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { nanoid } from "nanoid";

// GET: List pre-registered appointments for the current user
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const where: Record<string, unknown> = { recipientId: session.user.id };
    if (status) where.status = status;

    // If admin, show all
    if (["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      delete where.recipientId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        visitor: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true, company: true, photo: true },
        },
        recipient: { select: { firstName: true, lastName: true } },
        department: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Failed to fetch pre-registrations:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST: Staff pre-registers a visitor
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["STAFF", "DEPARTMENT_HEAD", "ADMIN", "SUPER_ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, company, purpose, date, startTime, endTime, notes } = body;

    if (!firstName || !lastName || !phone || !purpose || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find or create visitor
    let visitor = await prisma.visitor.findFirst({ where: { phone } });
    if (!visitor) {
      visitor = await prisma.visitor.create({
        data: {
          firstName,
          lastName,
          email: email || null,
          phone,
          company: company || null,
        },
      });
    }

    const appointmentCode = `VF-${nanoid(8).toUpperCase()}`;
    const dateObj = new Date(date);
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const start = new Date(dateObj);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(dateObj);
    end.setHours(eh, em, 0, 0);

    const appointment = await prisma.appointment.create({
      data: {
        appointmentCode,
        visitorId: visitor.id,
        recipientId: session.user.id,
        departmentId: session.user.departmentId || null,
        branchId: session.user.branchId || null,
        purpose,
        date: dateObj,
        startTime: start,
        endTime: end,
        status: "APPROVED", // Pre-registered by staff = auto-approved
        notes: notes || null,
      },
      include: {
        visitor: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "VISITOR_PRE_REGISTERED",
      entity: "Appointment",
      entityId: appointment.id,
      newValues: { visitorName: `${firstName} ${lastName}`, code: appointmentCode },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Pre-registration failed:", error);
    return NextResponse.json({ error: "Failed to pre-register visitor" }, { status: 500 });
  }
}
