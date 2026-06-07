import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Track all important system actions</p>
      </div>

      <div className="space-y-2">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{log.action}</Badge>
                    <span className="text-sm font-medium">{log.entity}</span>
                  </div>
                  {log.user && (
                    <p className="text-sm text-muted-foreground">
                      By: {log.user.firstName} {log.user.lastName} ({log.user.email})
                    </p>
                  )}
                  {log.ipAddress && (
                    <p className="text-xs text-muted-foreground">IP: {log.ipAddress}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {logs.length === 0 && (
          <Card><CardContent className="py-8 text-center"><p className="text-muted-foreground">No audit logs yet</p></CardContent></Card>
        )}
      </div>
    </div>
  );
}
