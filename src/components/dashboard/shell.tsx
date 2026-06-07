"use client";

import React, { useState } from "react";
import { DashboardSidebar } from "./sidebar";
import { DashboardHeader } from "./header";
import { MobileSidebar } from "./mobile-sidebar";
import { ChatWidget } from "./chat-widget";

interface DashboardShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <DashboardSidebar role={user.role} />
      <MobileSidebar
        role={user.role}
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="lg:pl-64">
        <DashboardHeader
          user={user}
          onMenuToggle={() => setMobileOpen(true)}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
      <ChatWidget userId={user.id} />
    </div>
  );
}
