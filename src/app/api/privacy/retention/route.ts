import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

// GET: List data retention policies
export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const policies = await prisma.dataRetentionPolicy.findMany({
      orderBy: { entityType: "asc" },
    });
    return NextResponse.json(policies);
  } catch (error) {
    console.error("Failed to fetch retention policies:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST: Create or update a retention policy
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { entityType, retentionDays, action } = body;

    if (!entityType || !retentionDays || !action) {
      return NextResponse.json({ error: "entityType, retentionDays, action required" }, { status: 400 });
    }

    const policy = await prisma.dataRetentionPolicy.upsert({
      where: { entityType },
      update: { retentionDays, action, isActive: true },
      create: { entityType, retentionDays, action },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "RETENTION_POLICY_UPDATE",
      entity: "DataRetentionPolicy",
      entityId: policy.id,
      newValues: { entityType, retentionDays, action },
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Retention policy update failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE: Run retention cleanup (dangerous action)
export async function DELETE() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const policies = await prisma.dataRetentionPolicy.findMany({
      where: { isActive: true },
    });

    const results: Record<string, number> = {};

    for (const policy of policies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

      if (policy.entityType === "visitor_log" && policy.action === "delete") {
        const { count } = await prisma.visitorLog.deleteMany({
          where: { checkInTime: { lt: cutoffDate }, status: "CHECKED_OUT" },
        });
        results.visitor_logs_deleted = count;
      } else if (policy.entityType === "visitor_log" && policy.action === "anonymize") {
        const { count } = await prisma.visitorLog.updateMany({
          where: { checkInTime: { lt: cutoffDate }, status: "CHECKED_OUT" },
          data: { notes: null, recipientName: "[REDACTED]" },
        });
        results.visitor_logs_anonymized = count;
      } else if (policy.entityType === "documents" && policy.action === "delete") {
        const { count } = await prisma.visitorDocument.deleteMany({
          where: { createdAt: { lt: cutoffDate } },
        });
        results.documents_deleted = count;
      }

      await prisma.dataRetentionPolicy.update({
        where: { id: policy.id },
        data: { lastRunAt: new Date() },
      });
    }

    await createAuditLog({
      userId: session.user.id,
      action: "RETENTION_CLEANUP",
      entity: "DataRetentionPolicy",
      newValues: results as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Retention cleanup failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
