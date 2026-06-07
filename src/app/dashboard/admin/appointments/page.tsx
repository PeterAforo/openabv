"use client";

import React, { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getStatusColor } from "@/lib/utils";

interface Appointment {
  id: string;
  appointmentCode: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  visitor: { firstName: string; lastName: string; phone: string };
  recipient: { firstName: string; lastName: string };
  department?: { name: string } | null;
}

const columns: ColumnDef<Appointment>[] = [
  {
    accessorKey: "appointmentCode",
    header: "Code",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.appointmentCode}</span>
    ),
  },
  {
    accessorKey: "visitor",
    header: "Visitor",
    accessorFn: (row) => `${row.visitor.firstName} ${row.visitor.lastName}`,
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.visitor.firstName} {row.original.visitor.lastName}</p>
        <p className="text-xs text-muted-foreground">{row.original.visitor.phone}</p>
      </div>
    ),
  },
  {
    accessorKey: "recipient",
    header: "Recipient",
    accessorFn: (row) => `${row.recipient.firstName} ${row.recipient.lastName}`,
    cell: ({ row }) => (
      <div>
        <p>{row.original.recipient.firstName} {row.original.recipient.lastName}</p>
        {row.original.department && (
          <p className="text-xs text-muted-foreground">{row.original.department.name}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
  },
  {
    accessorKey: "startTime",
    header: "Time",
    cell: ({ row }) => new Date(row.original.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={getStatusColor(row.original.status)}>{row.original.status}</Badge>
    ),
  },
  {
    accessorKey: "purpose",
    header: "Purpose",
    cell: ({ row }) => (
      <span className="text-sm max-w-[200px] truncate block">{row.original.purpose}</span>
    ),
  },
];

function exportAppointmentsCSV(appointments: Appointment[]) {
  const headers = ["Code", "Visitor", "Phone", "Recipient", "Date", "Time", "Status", "Purpose"];
  const rows = appointments.map((a) => [
    a.appointmentCode,
    `${a.visitor.firstName} ${a.visitor.lastName}`,
    a.visitor.phone,
    `${a.recipient.firstName} ${a.recipient.lastName}`,
    new Date(a.date).toLocaleDateString(),
    new Date(a.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    a.status,
    a.purpose,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `appointments-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  async function fetchAppointments() {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "200");
      const res = await fetch(`/api/appointments?${params}`);
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Appointments</h1>
          <p className="text-muted-foreground">{appointments.length} appointments</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="DECLINED">Declined</SelectItem>
            <SelectItem value="CHECKED_IN">Checked In</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="NO_SHOW">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={appointments}
        searchPlaceholder="Search appointments..."
        onExport={() => exportAppointmentsCSV(appointments)}
      />
    </div>
  );
}
