import prisma from "@/lib/prisma";

interface ApprovalContext {
  visitorId: string;
  visitorType: string;
  departmentId?: string;
  recipientId: string;
  visitTime: Date;
  phone?: string;
}

interface RuleConditions {
  visitorType?: string[];
  department?: string[];
  timeRange?: { start: string; end: string };
  maxDailyVisits?: number;
  trustedVisitor?: boolean;
  blockOutsideHours?: boolean;
}

export type ApprovalDecision = "auto_approve" | "require_approval" | "block";

export async function evaluateApprovalRules(context: ApprovalContext): Promise<{
  decision: ApprovalDecision;
  ruleName?: string;
  reason?: string;
}> {
  const rules = await prisma.approvalRule.findMany({
    where: { isActive: true },
    orderBy: { priority: "desc" },
  });

  for (const rule of rules) {
    const conditions: RuleConditions = JSON.parse(rule.conditions);
    let matched = true;

    // Check visitor type
    if (conditions.visitorType && conditions.visitorType.length > 0) {
      if (!conditions.visitorType.includes(context.visitorType)) {
        matched = false;
      }
    }

    // Check department
    if (conditions.department && conditions.department.length > 0 && context.departmentId) {
      if (!conditions.department.includes(context.departmentId)) {
        matched = false;
      }
    }

    // Check time range (block outside hours)
    if (conditions.blockOutsideHours || conditions.timeRange) {
      const hour = context.visitTime.getHours();
      const start = conditions.timeRange?.start ? parseInt(conditions.timeRange.start.split(":")[0]) : 8;
      const end = conditions.timeRange?.end ? parseInt(conditions.timeRange.end.split(":")[0]) : 17;

      if (hour < start || hour >= end) {
        if (rule.action === "block") {
          return { decision: "block", ruleName: rule.name, reason: "Outside visiting hours" };
        }
        matched = false;
      }
    }

    // Check daily visit limit
    if (conditions.maxDailyVisits) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCount = await prisma.appointment.count({
        where: {
          recipientId: context.recipientId,
          date: { gte: today, lt: tomorrow },
          status: { notIn: ["CANCELLED", "DECLINED"] },
        },
      });

      if (todayCount >= conditions.maxDailyVisits) {
        return { decision: "block", ruleName: rule.name, reason: `Staff has reached daily limit of ${conditions.maxDailyVisits} visits` };
      }
    }

    // Check trusted visitor (auto-approve repeat visitors)
    if (conditions.trustedVisitor) {
      const previousVisits = await prisma.appointment.count({
        where: {
          visitorId: context.visitorId,
          status: { in: ["COMPLETED", "CHECKED_OUT"] },
        },
      });

      if (previousVisits >= 3 && rule.action === "auto_approve") {
        return { decision: "auto_approve", ruleName: rule.name, reason: "Trusted repeat visitor" };
      }
    }

    if (matched) {
      return { decision: rule.action as ApprovalDecision, ruleName: rule.name };
    }
  }

  // Default: require approval
  return { decision: "require_approval" };
}
