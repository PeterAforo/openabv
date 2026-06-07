import type { UserRole, AppointmentStatus, WalkInDecision, IDType } from "@prisma/client";

export type { UserRole, AppointmentStatus, WalkInDecision, IDType };

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image?: string | null;
  departmentId?: string | null;
  branchId?: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}

export interface AppointmentWithRelations {
  id: string;
  appointmentCode: string;
  qrCodeToken: string;
  status: AppointmentStatus;
  date: Date;
  startTime: Date;
  endTime: Date;
  purpose: string;
  notes?: string | null;
  visitor: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone: string;
    company?: string | null;
  };
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  department?: { name: string } | null;
  branch?: { name: string } | null;
}

export interface WalkInRequestWithRelations {
  id: string;
  decision: WalkInDecision;
  purpose: string;
  decisionNote?: string | null;
  createdAt: Date;
  respondedAt?: Date | null;
  visitor: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    company?: string | null;
  };
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface VisitorLogEntry {
  id: string;
  purpose: string;
  recipientName?: string | null;
  status: string;
  checkInTime: Date;
  checkOutTime?: Date | null;
  isWalkIn: boolean;
  badgeNumber?: string | null;
  visitor: {
    firstName: string;
    lastName: string;
    phone: string;
    company?: string | null;
  };
}
