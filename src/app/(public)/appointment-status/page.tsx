"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface AppointmentResult {
  id: string;
  appointmentCode: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  visitor: { firstName: string; lastName: string };
  recipient: { firstName: string; lastName: string };
}

export default function AppointmentStatusPage() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentResult | null>(null);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/appointments/status?code=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Appointment not found");
        setAppointment(null);
        return;
      }

      setAppointment(data);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">OA</span>
            </div>
            <span className="text-xl font-bold">OpenABV</span>
          </Link>
          <h1 className="text-3xl font-bold">Check Appointment Status</h1>
          <p className="text-muted-foreground mt-2">Enter your reference code to check status</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Lookup</CardTitle>
            <CardDescription>Enter the reference code you received when booking</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Reference Code</Label>
                <Input
                  id="code"
                  placeholder="APT-XXXXXX-XXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Searching..." : "Check Status"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {appointment && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Appointment Details</CardTitle>
                <Badge className={getStatusColor(appointment.status)}>
                  {appointment.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-medium font-mono">{appointment.appointmentCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {new Date(appointment.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" - "}
                    {new Date(appointment.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Meeting With</p>
                  <p className="font-medium">
                    {appointment.recipient.firstName} {appointment.recipient.lastName}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Purpose</p>
                  <p className="font-medium">{appointment.purpose}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Need to book an appointment?{" "}
          <Link href="/book-appointment" className="text-primary hover:underline font-medium">
            Book here
          </Link>
        </p>
      </div>
    </div>
  );
}
