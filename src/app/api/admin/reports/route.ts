import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const staffId = searchParams.get("staffId");
  const visitorPhone = searchParams.get("visitorPhone");

  try {
    const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = to ? new Date(to + "T23:59:59") : new Date();

    const appointmentWhere: Record<string, unknown> = {
      date: { gte: dateFrom, lte: dateTo },
    };
    const logWhere: Record<string, unknown> = {
      checkInTime: { gte: dateFrom, lte: dateTo },
    };

    if (staffId) {
      appointmentWhere.recipientId = staffId;
      logWhere.hostId = staffId;
    }

    // Stats
    const [
      totalAppointments,
      approvedCount,
      declinedCount,
      noShowCount,
      cancelledCount,
      checkedInCount,
      totalVisitorLogs,
      walkInCount,
      currentInside,
    ] = await Promise.all([
      prisma.appointment.count({ where: appointmentWhere }),
      prisma.appointment.count({ where: { ...appointmentWhere, status: "APPROVED" } }),
      prisma.appointment.count({ where: { ...appointmentWhere, status: "DECLINED" } }),
      prisma.appointment.count({ where: { ...appointmentWhere, status: "NO_SHOW" } }),
      prisma.appointment.count({ where: { ...appointmentWhere, status: "CANCELLED" } }),
      prisma.appointment.count({ where: { ...appointmentWhere, status: "CHECKED_IN" } }),
      prisma.visitorLog.count({ where: logWhere }),
      prisma.visitorLog.count({ where: { ...logWhere, isWalkIn: true } }),
      prisma.visitorLog.count({ where: { status: "CHECKED_IN" } }),
    ]);

    // Daily breakdown for chart
    const days: { date: string; appointments: number; visitors: number }[] = [];
    const diffDays = Math.min(Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (24 * 60 * 60 * 1000)), 60);
    for (let i = 0; i < diffDays; i++) {
      const dayStart = new Date(dateFrom);
      dayStart.setDate(dayStart.getDate() + i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayApptWhere = { ...appointmentWhere, date: { gte: dayStart, lte: dayEnd } };
      const dayLogWhere = { ...logWhere, checkInTime: { gte: dayStart, lte: dayEnd } };

      const [appts, logs] = await Promise.all([
        prisma.appointment.count({ where: dayApptWhere }),
        prisma.visitorLog.count({ where: dayLogWhere }),
      ]);
      days.push({ date: dayStart.toISOString().split("T")[0], appointments: appts, visitors: logs });
    }

    // Top staff by visits
    const topStaff = await prisma.appointment.groupBy({
      by: ["recipientId"],
      where: appointmentWhere,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const topStaffIds = topStaff.map(s => s.recipientId);
    const staffUsers = await prisma.user.findMany({
      where: { id: { in: topStaffIds } },
      select: { id: true, firstName: true, lastName: true, department: { select: { name: true } } },
    });

    const staffRanking = topStaff.map(s => {
      const user = staffUsers.find(u => u.id === s.recipientId);
      return {
        id: s.recipientId,
        name: user ? `${user.firstName} ${user.lastName}` : "Unknown",
        department: user?.department?.name || "-",
        count: s._count.id,
      };
    });

    // Individual visitor lookup
    let visitorHistory = null;
    if (visitorPhone) {
      const visitor = await prisma.visitor.findFirst({
        where: { phone: visitorPhone },
        select: { id: true, firstName: true, lastName: true, phone: true, company: true, photo: true },
      });
      if (visitor) {
        const visits = await prisma.visitorLog.findMany({
          where: { visitorId: visitor.id },
          orderBy: { checkInTime: "desc" },
          take: 20,
          select: { id: true, checkInTime: true, checkOutTime: true, purpose: true, recipientName: true, status: true, isWalkIn: true },
        });
        const appointments = await prisma.appointment.findMany({
          where: { visitorId: visitor.id },
          orderBy: { date: "desc" },
          take: 20,
          select: { id: true, appointmentCode: true, date: true, status: true, purpose: true, recipient: { select: { firstName: true, lastName: true } } },
        });
        visitorHistory = { visitor, visits, appointments };
      }
    }

    return NextResponse.json({
      stats: {
        totalAppointments,
        approvedCount,
        declinedCount,
        noShowCount,
        cancelledCount,
        checkedInCount,
        totalVisitorLogs,
        walkInCount,
        currentInside,
      },
      dailyBreakdown: days,
      staffRanking,
      visitorHistory,
      dateRange: { from: dateFrom.toISOString(), to: dateTo.toISOString() },
    });
  } catch (error) {
    console.error("Reports failed:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
