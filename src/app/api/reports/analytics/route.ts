import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowedRoles = ["ADMIN", "SUPER_ADMIN", "DEPARTMENT_HEAD"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days
    const branchId = searchParams.get("branchId");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const dateFilter = { gte: startDate };
    const branchFilter = branchId ? { branchId } : {};

    // Total visitors
    const totalVisitors = await prisma.visitorLog.count({
      where: { checkInTime: dateFilter, ...branchFilter },
    });

    // Walk-in vs Appointment ratio
    const walkIns = await prisma.visitorLog.count({
      where: { checkInTime: dateFilter, isWalkIn: true, ...branchFilter },
    });

    const appointments = await prisma.visitorLog.count({
      where: { checkInTime: dateFilter, isWalkIn: false, ...branchFilter },
    });

    // No-show rate
    const totalAppointments = await prisma.appointment.count({
      where: { date: dateFilter, ...(branchId ? { branchId } : {}) },
    });

    const noShows = await prisma.appointment.count({
      where: { date: dateFilter, status: "NO_SHOW", ...(branchId ? { branchId } : {}) },
    });

    // Average waiting time (arrivedAt to respondedAt)
    const appointmentsWithWait = await prisma.appointment.findMany({
      where: {
        date: dateFilter,
        arrivedAt: { not: null },
        respondedAt: { not: null },
        ...(branchId ? { branchId } : {}),
      },
      select: { arrivedAt: true, respondedAt: true },
    });

    let avgWaitMinutes = 0;
    if (appointmentsWithWait.length > 0) {
      const totalWait = appointmentsWithWait.reduce((sum, a) => {
        const wait = (a.respondedAt!.getTime() - a.arrivedAt!.getTime()) / 60000;
        return sum + wait;
      }, 0);
      avgWaitMinutes = Math.round(totalWait / appointmentsWithWait.length);
    }

    // Department visit volume
    const departmentStats = await prisma.appointment.groupBy({
      by: ["departmentId"],
      where: { date: dateFilter, ...(branchId ? { branchId } : {}), departmentId: { not: null } },
      _count: { id: true },
    });

    const departments = await prisma.department.findMany({
      where: { id: { in: departmentStats.map((d) => d.departmentId!).filter(Boolean) } },
      select: { id: true, name: true },
    });

    const departmentVisits = departmentStats.map((d) => ({
      department: departments.find((dept) => dept.id === d.departmentId)?.name || "Unknown",
      count: d._count.id,
    }));

    // Staff visit frequency (top 10)
    const staffStats = await prisma.appointment.groupBy({
      by: ["recipientId"],
      where: { date: dateFilter, ...(branchId ? { branchId } : {}) },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const staffUsers = await prisma.user.findMany({
      where: { id: { in: staffStats.map((s) => s.recipientId) } },
      select: { id: true, firstName: true, lastName: true },
    });

    const staffVisitFrequency = staffStats.map((s) => {
      const user = staffUsers.find((u) => u.id === s.recipientId);
      return {
        staff: user ? `${user.firstName} ${user.lastName}` : "Unknown",
        count: s._count.id,
      };
    });

    // Daily visitor traffic (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await prisma.visitorLog.count({
        where: {
          checkInTime: { gte: day, lt: nextDay },
          ...branchFilter,
        },
      });

      last7Days.push({
        date: day.toISOString().split("T")[0],
        dayName: day.toLocaleDateString("en", { weekday: "short" }),
        count,
      });
    }

    // Status breakdown
    const statusBreakdown = await prisma.appointment.groupBy({
      by: ["status"],
      where: { date: dateFilter, ...(branchId ? { branchId } : {}) },
      _count: { id: true },
    });

    return NextResponse.json({
      period: parseInt(period),
      summary: {
        totalVisitors,
        walkIns,
        appointments,
        walkInRatio: totalVisitors > 0 ? Math.round((walkIns / totalVisitors) * 100) : 0,
        noShowRate: totalAppointments > 0 ? Math.round((noShows / totalAppointments) * 100) : 0,
        avgWaitMinutes,
      },
      departmentVisits,
      staffVisitFrequency,
      dailyTraffic: last7Days,
      statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count.id })),
    });
  } catch (error) {
    console.error("Analytics failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
