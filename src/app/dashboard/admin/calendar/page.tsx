"use client";

import React from "react";
import { AppointmentCalendar } from "@/components/dashboard/appointment-calendar";

export default function AdminCalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">All appointments in calendar view</p>
      </div>
      <AppointmentCalendar />
    </div>
  );
}
