"use client";

import React from "react";
import { AppointmentCalendar } from "@/components/dashboard/appointment-calendar";
import { useRouter } from "next/navigation";

export default function StaffCalendarPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">View your appointments in calendar view</p>
      </div>
      <AppointmentCalendar
        onEventClick={(id) => router.push(`/dashboard/staff/appointments?highlight=${id}`)}
      />
    </div>
  );
}
