"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStatusColor } from "@/lib/utils";
import { Check, X, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Appointment {
  id: string;
  appointmentCode: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  notes?: string;
  visitor: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    company?: string;
  };
}

export default function StaffAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [decisionType, setDecisionType] = useState<string>("");
  const [reason, setReason] = useState("");
  const [rescheduledDate, setRescheduledDate] = useState("");
  const [rescheduledTime, setRescheduledTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDecision() {
    if (!selectedApt || !decisionType) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/appointments/${selectedApt.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: decisionType,
          reason,
          rescheduledDate: decisionType === "RESCHEDULED" ? rescheduledDate : undefined,
          rescheduledTime: decisionType === "RESCHEDULED" ? rescheduledTime : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to process decision");
        return;
      }

      toast.success(`Appointment ${decisionType.toLowerCase()}`);
      setSelectedApt(null);
      setDecisionType("");
      setReason("");
      fetchAppointments();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading appointments...</p>
      </div>
    );
  }

  const pendingAppts = appointments.filter((a) => a.status === "PENDING");
  const otherAppts = appointments.filter((a) => a.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
        <p className="text-muted-foreground">Manage your appointment requests</p>
      </div>

      {pendingAppts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-orange-600">
            Pending Approval ({pendingAppts.length})
          </h2>
          {pendingAppts.map((apt) => (
            <Card key={apt.id} className="border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{apt.visitor.firstName} {apt.visitor.lastName}</p>
                    {apt.visitor.company && <p className="text-sm text-muted-foreground">{apt.visitor.company}</p>}
                    <p className="text-sm">Purpose: {apt.purpose}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(apt.date).toLocaleDateString()} | {new Date(apt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(apt.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { setSelectedApt(apt); setDecisionType("APPROVED"); }}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedApt(apt); setDecisionType("RESCHEDULED"); }}>
                      <Calendar className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setSelectedApt(apt); setDecisionType("DECLINED"); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {otherAppts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">All Appointments</h2>
          {otherAppts.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{apt.visitor.firstName} {apt.visitor.lastName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(apt.date).toLocaleDateString()} - {apt.purpose}
                    </p>
                  </div>
                  <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {appointments.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No appointments yet</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedApt && !!decisionType} onOpenChange={() => { setSelectedApt(null); setDecisionType(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionType === "APPROVED" && "Approve Appointment"}
              {decisionType === "DECLINED" && "Decline Appointment"}
              {decisionType === "RESCHEDULED" && "Reschedule Appointment"}
            </DialogTitle>
            <DialogDescription>
              {selectedApt && `${selectedApt.visitor.firstName} ${selectedApt.visitor.lastName} - ${selectedApt.purpose}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {decisionType === "RESCHEDULED" && (
              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-2">
                  <Label>New Date</Label>
                  <Input type="date" value={rescheduledDate} onChange={(e) => setRescheduledDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>New Time</Label>
                  <Input type="time" value={rescheduledTime} onChange={(e) => setRescheduledTime(e.target.value)} />
                </div>
              </div>
            )}
            {decisionType !== "APPROVED" && (
              <div className="space-y-2">
                <Label>Reason {decisionType === "DECLINED" ? "(required)" : "(optional)"}</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason..." />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedApt(null); setDecisionType(""); }}>
              Cancel
            </Button>
            <Button onClick={handleDecision} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
