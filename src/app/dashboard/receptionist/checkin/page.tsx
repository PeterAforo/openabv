"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, UserCheck } from "lucide-react";

interface AppointmentResult {
  id: string;
  appointmentCode: string;
  status: string;
  date: string;
  startTime: string;
  purpose: string;
  visitor: { id: string; firstName: string; lastName: string; phone: string };
  recipient: { firstName: string; lastName: string };
}

export default function ReceptionistCheckinPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AppointmentResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [badgeNumber, setBadgeNumber] = useState("");

  async function handleSearch() {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/visitors/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(data.appointments || []);
      if ((data.appointments || []).length === 0) toast.info("No appointments found");
    } catch {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleCheckin(appointment: AppointmentResult) {
    try {
      const res = await fetch("/api/visitors/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          visitorId: appointment.visitor.id,
          purpose: appointment.purpose,
          recipientName: `${appointment.recipient.firstName} ${appointment.recipient.lastName}`,
          badgeNumber: badgeNumber || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Check-in failed");
        return;
      }
      toast.success(`${appointment.visitor.firstName} ${appointment.visitor.lastName} checked in`);
      setResults((prev) => prev.filter((r) => r.id !== appointment.id));
      setBadgeNumber("");
    } catch {
      toast.error("Check-in failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Check-In</h1>
        <p className="text-muted-foreground">Search for appointments and check in visitors</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by name, phone, or appointment code..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="h-4 w-4 mr-2" /> {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 max-w-xs">
            <Label className="whitespace-nowrap">Badge #</Label>
            <Input value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} placeholder="Optional" />
          </div>
          {results.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{apt.visitor.firstName} {apt.visitor.lastName}</p>
                      <Badge>{apt.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">{apt.appointmentCode}</p>
                    <p className="text-sm text-muted-foreground">
                      With: {apt.recipient.firstName} {apt.recipient.lastName} | {apt.purpose}
                    </p>
                  </div>
                  <Button onClick={() => handleCheckin(apt)} className="gap-1">
                    <UserCheck className="h-4 w-4" /> Check In
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
