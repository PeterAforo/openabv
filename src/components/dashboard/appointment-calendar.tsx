"use client";

import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    status: string;
    appointmentCode: string;
    visitorName: string;
    purpose: string;
  };
}

interface AppointmentCalendarProps {
  onEventClick?: (appointmentId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  APPROVED: "#3b82f6",
  DECLINED: "#ef4444",
  CHECKED_IN: "#22c55e",
  COMPLETED: "#6b7280",
  NO_SHOW: "#dc2626",
  CANCELLED: "#9ca3af",
  RESCHEDULED: "#8b5cf6",
};

export function AppointmentCalendar({ onEventClick }: AppointmentCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const res = await fetch("/api/appointments?limit=200");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const mapped: CalendarEvent[] = (data.appointments || []).map(
          (apt: {
            id: string;
            status: string;
            appointmentCode: string;
            startTime: string;
            endTime: string;
            purpose: string;
            visitor: { firstName: string; lastName: string };
          }) => ({
            id: apt.id,
            title: `${apt.visitor.firstName} ${apt.visitor.lastName}`,
            start: apt.startTime,
            end: apt.endTime,
            backgroundColor: STATUS_COLORS[apt.status] || "#6b7280",
            borderColor: STATUS_COLORS[apt.status] || "#6b7280",
            extendedProps: {
              status: apt.status,
              appointmentCode: apt.appointmentCode,
              visitorName: `${apt.visitor.firstName} ${apt.visitor.lastName}`,
              purpose: apt.purpose,
            },
          })
        );
        setEvents(mapped);
      } catch {
        toast.error("Failed to load appointments");
      }
    }
    fetchAppointments();
  }, []);

  return (
    <div className="bg-background rounded-lg border p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        events={events}
        eventClick={(info) => onEventClick?.(info.event.id)}
        height="auto"
        nowIndicator
        slotMinTime="07:00:00"
        slotMaxTime="19:00:00"
        weekends={false}
        eventContent={(eventInfo) => (
          <div className="p-1 text-xs overflow-hidden">
            <div className="font-medium truncate">{eventInfo.event.title}</div>
            <div className="opacity-75 truncate">
              {eventInfo.event.extendedProps.purpose}
            </div>
          </div>
        )}
      />
    </div>
  );
}
