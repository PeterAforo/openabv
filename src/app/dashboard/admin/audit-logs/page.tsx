import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AuditLogList } from "./audit-log-list";

export default async function AdminAuditLogsPage() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const logs = await prisma.auditLog.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const serialized = logs.map((l) => ({
    id: l.id,
    action: l.action,
    entity: l.entity,
    entityId: l.entityId,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
    user: l.user ? { firstName: l.user.firstName, lastName: l.user.lastName, email: l.user.email } : null,
  }));

  return <AuditLogList logs={serialized} />;
}
