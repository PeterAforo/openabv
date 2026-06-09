import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "SECURITY", "RECEPTIONIST", "STAFF", "DEPARTMENT_HEAD"]),
  departmentId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  image: z.string().optional().nullable(),
});

export const bookAppointmentSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(10, "Valid phone number is required"),
  company: z.string().optional(),
  recipientId: z.string().uuid("Please select a recipient"),
  departmentId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  purpose: z.string().min(5, "Purpose must be at least 5 characters"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  notes: z.string().optional(),
  photo: z.string().optional().nullable(),
});

export const walkInVisitorSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(10, "Valid phone number is required"),
  company: z.string().optional(),
  idType: z.enum(["NATIONAL_ID", "PASSPORT", "DRIVERS_LICENSE", "VOTER_ID", "COMPANY_ID", "OTHER"]).optional(),
  idNumber: z.string().optional(),
  vehicleNumber: z.string().optional(),
  purpose: z.string().min(5, "Purpose of visit is required"),
  recipientId: z.string().uuid("Please select a recipient"),
  photo: z.string().optional(),
});

export const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  description: z.string().optional(),
});

export const branchSchema = z.object({
  name: z.string().min(2, "Branch name must be at least 2 characters"),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
});

export const appointmentDecisionSchema = z.object({
  appointmentId: z.string().uuid(),
  decision: z.enum(["APPROVED", "DECLINED", "RESCHEDULED"]),
  reason: z.string().optional(),
  rescheduledDate: z.string().optional(),
  rescheduledTime: z.string().optional(),
});

export const walkInDecisionSchema = z.object({
  walkInRequestId: z.string().uuid(),
  decision: z.enum(["APPROVED", "DECLINED", "WAIT", "RESCHEDULED"]),
  note: z.string().optional(),
});

export const chatMessageSchema = z.object({
  walkInRequestId: z.string().uuid(),
  message: z.string().min(1, "Message cannot be empty"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type WalkInVisitorInput = z.infer<typeof walkInVisitorSchema>;
export type DepartmentInput = z.infer<typeof departmentSchema>;
export type BranchInput = z.infer<typeof branchSchema>;
export type AppointmentDecisionInput = z.infer<typeof appointmentDecisionSchema>;
export type WalkInDecisionInput = z.infer<typeof walkInDecisionSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
