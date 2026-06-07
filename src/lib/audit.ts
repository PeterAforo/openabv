import prisma from "@/lib/prisma";

interface AuditLogOptions {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(options: AuditLogOptions) {
  return prisma.auditLog.create({
    data: {
      userId: options.userId,
      action: options.action,
      entity: options.entity,
      entityId: options.entityId,
      oldValues: options.oldValues ? JSON.stringify(options.oldValues) : null,
      newValues: options.newValues ? JSON.stringify(options.newValues) : null,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    },
  });
}
