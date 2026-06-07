import { UserRole } from "@prisma/client";

export type Permission =
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  | "departments.view"
  | "departments.create"
  | "departments.edit"
  | "departments.delete"
  | "branches.view"
  | "branches.create"
  | "branches.edit"
  | "branches.delete"
  | "appointments.view"
  | "appointments.view_all"
  | "appointments.create"
  | "appointments.approve"
  | "appointments.decline"
  | "appointments.reschedule"
  | "appointments.cancel"
  | "visitors.view"
  | "visitors.checkin"
  | "visitors.checkout"
  | "visitors.register_walkin"
  | "walkins.view"
  | "walkins.approve"
  | "walkins.decline"
  | "reports.view"
  | "reports.export"
  | "settings.view"
  | "settings.edit"
  | "audit_logs.view"
  | "notifications.view"
  | "notifications.manage"
  | "calendar.view"
  | "calendar.manage";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "users.view", "users.create", "users.edit", "users.delete",
    "departments.view", "departments.create", "departments.edit", "departments.delete",
    "branches.view", "branches.create", "branches.edit", "branches.delete",
    "appointments.view", "appointments.view_all", "appointments.create",
    "appointments.approve", "appointments.decline", "appointments.reschedule", "appointments.cancel",
    "visitors.view", "visitors.checkin", "visitors.checkout", "visitors.register_walkin",
    "walkins.view", "walkins.approve", "walkins.decline",
    "reports.view", "reports.export",
    "settings.view", "settings.edit",
    "audit_logs.view",
    "notifications.view", "notifications.manage",
    "calendar.view", "calendar.manage",
  ],
  ADMIN: [
    "users.view", "users.create", "users.edit",
    "departments.view", "departments.create", "departments.edit",
    "branches.view", "branches.create", "branches.edit",
    "appointments.view", "appointments.view_all", "appointments.create",
    "appointments.approve", "appointments.decline", "appointments.reschedule", "appointments.cancel",
    "visitors.view", "visitors.checkin", "visitors.checkout", "visitors.register_walkin",
    "walkins.view", "walkins.approve", "walkins.decline",
    "reports.view", "reports.export",
    "settings.view", "settings.edit",
    "audit_logs.view",
    "notifications.view", "notifications.manage",
    "calendar.view", "calendar.manage",
  ],
  DEPARTMENT_HEAD: [
    "appointments.view", "appointments.view_all",
    "appointments.approve", "appointments.decline", "appointments.reschedule",
    "visitors.view",
    "walkins.view", "walkins.approve", "walkins.decline",
    "reports.view",
    "notifications.view",
    "calendar.view", "calendar.manage",
  ],
  STAFF: [
    "appointments.view",
    "appointments.approve", "appointments.decline", "appointments.reschedule",
    "walkins.view", "walkins.approve", "walkins.decline",
    "notifications.view",
    "calendar.view", "calendar.manage",
  ],
  SECURITY: [
    "appointments.view",
    "visitors.view", "visitors.checkin", "visitors.checkout", "visitors.register_walkin",
    "walkins.view",
    "notifications.view",
  ],
  RECEPTIONIST: [
    "appointments.view", "appointments.create",
    "visitors.view", "visitors.checkin", "visitors.checkout", "visitors.register_walkin",
    "walkins.view",
    "notifications.view",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "/dashboard/admin";
    case "SECURITY":
      return "/dashboard/security";
    case "RECEPTIONIST":
      return "/dashboard/receptionist";
    case "STAFF":
    case "DEPARTMENT_HEAD":
      return "/dashboard/staff";
    default:
      return "/dashboard";
  }
}
