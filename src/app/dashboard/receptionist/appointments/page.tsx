"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getStatusColor } from "@/lib/utils";
import { Search } from "lucide-react";

interface Appointment {
  id: string;
  appointmentCode: string;
  status: string;
  date: string;
  startTime: string;
  purpose: string;
  visitor: { firstName: string; lastName: string; phone: string };
  recipient: { firstName: string; lastName: string };
}

export default function ReceptionistAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.set("status", statusFilter);
        const res = await fetch(`/api/appointments?${params}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setAppointments(data.appointments || []);
      } catch {
        toast.error("Failed to load appointments");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [statusFilter]);

  const filtered = appointments.filter((a) =>
    `${a.visitor.firstName} ${a.visitor.lastName} ${a.appointmentCode}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
        <p className="text-muted-foreground">View today&apos;s and upcoming appointments</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="CHECKED_IN">Checked In</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((apt) => (
          <Card key={apt.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{apt.visitor.firstName} {apt.visitor.lastName}</p>
                    <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">{apt.appointmentCode}</p>
                  <p className="text-sm text-muted-foreground">With: {apt.recipient.firstName} {apt.recipient.lastName}</p>
                  <p className="text-sm text-muted-foreground">Purpose: {apt.purpose}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{new Date(apt.date).toLocaleDateString()}</p>
                  <p>{new Date(apt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card><CardContent className="py-8 text-center"><p className="text-muted-foreground">No appointments found</p></CardContent></Card>
        )}
      </div>
    </div>
  );
}
