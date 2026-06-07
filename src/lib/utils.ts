import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateAppointmentCode(): string {
  const prefix = "APT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    DECLINED: "bg-red-100 text-red-800",
    RESCHEDULED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    CHECKED_IN: "bg-emerald-100 text-emerald-800",
    CHECKED_OUT: "bg-slate-100 text-slate-800",
    NO_SHOW: "bg-orange-100 text-orange-800",
    COMPLETED: "bg-purple-100 text-purple-800",
    WAIT: "bg-amber-100 text-amber-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}
