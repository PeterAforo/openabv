"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { X, LogOut, LayoutDashboard, Calendar, Users, Shield, Building2, GitBranch, ClipboardList, UserCheck, Bell, BarChart3, Settings, MessageSquare, Clock, FileText, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { title: "Appointments", href: "/dashboard/admin/appointments", icon: Calendar },
  { title: "Visitors", href: "/dashboard/admin/visitors", icon: Users },
  { title: "Users", href: "/dashboard/admin/users", icon: Shield },
  { title: "Departments", href: "/dashboard/admin/departments", icon: Building2 },
  { title: "Branches", href: "/dashboard/admin/branches", icon: GitBranch },
  { title: "Calendar", href: "/dashboard/admin/calendar", icon: Calendar },
  { title: "Reports", href: "/dashboard/admin/reports", icon: BarChart3 },
  { title: "Notifications", href: "/dashboard/admin/notifications", icon: Bell },
  { title: "Live Chat", href: "/dashboard/chat", icon: MessageSquare },
  { title: "Visitor Queue", href: "/dashboard/queue", icon: ListOrdered },
  { title: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: FileText },
  { title: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

const securityNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/security", icon: LayoutDashboard },
  { title: "Check Appointment", href: "/dashboard/security/check", icon: ClipboardList },
  { title: "Walk-In", href: "/dashboard/security/walkin", icon: UserCheck },
  { title: "Visitor Queue", href: "/dashboard/queue", icon: ListOrdered },
  { title: "Current Visitors", href: "/dashboard/security/current", icon: Users },
  { title: "Visitor Log", href: "/dashboard/security/log", icon: Clock },
  { title: "Live Chat", href: "/dashboard/chat", icon: MessageSquare },
  { title: "Notifications", href: "/dashboard/security/notifications", icon: Bell },
];

const staffNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/staff", icon: LayoutDashboard },
  { title: "Appointments", href: "/dashboard/staff/appointments", icon: Calendar },
  { title: "Walk-In Requests", href: "/dashboard/staff/walkins", icon: UserCheck },
  { title: "Calendar", href: "/dashboard/staff/calendar", icon: Calendar },
  { title: "Live Chat", href: "/dashboard/chat", icon: MessageSquare },
  { title: "Messages", href: "/dashboard/staff/messages", icon: MessageSquare },
  { title: "Visitor History", href: "/dashboard/staff/history", icon: Clock },
  { title: "Notifications", href: "/dashboard/staff/notifications", icon: Bell },
];

const receptionistNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/receptionist", icon: LayoutDashboard },
  { title: "Appointments", href: "/dashboard/receptionist/appointments", icon: Calendar },
  { title: "Check-In", href: "/dashboard/receptionist/checkin", icon: UserCheck },
  { title: "Walk-In", href: "/dashboard/receptionist/walkin", icon: Users },
  { title: "Visitor Queue", href: "/dashboard/queue", icon: ListOrdered },
  { title: "Current Visitors", href: "/dashboard/receptionist/current", icon: Clock },
  { title: "Live Chat", href: "/dashboard/chat", icon: MessageSquare },
  { title: "Notifications", href: "/dashboard/receptionist/notifications", icon: Bell },
];

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return adminNav;
    case "SECURITY":
      return securityNav;
    case "RECEPTIONIST":
      return receptionistNav;
    default:
      return staffNav;
  }
}

interface MobileSidebarProps {
  role: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ role, isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-64 bg-sidebar-background border-r shadow-lg">
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">OA</span>
            </div>
            <span className="font-semibold text-lg">OpenABV</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 py-4 h-[calc(100vh-8rem)]">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </div>
    </div>
  );
}
