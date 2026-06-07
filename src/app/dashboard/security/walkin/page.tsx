"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStatusColor } from "@/lib/utils";
import LiveChat from "@/components/dashboard/live-chat";

interface StaffOption {
  id: string;
  firstName: string;
  lastName: string;
  department?: { name: string } | null;
}

interface RecentWalkIn {
  id: string;
  decision: string;
  purpose: string;
  createdAt: string;
  visitor: { firstName: string; lastName: string; phone: string };
  recipient: { firstName: string; lastName: string };
}

export default function WalkInRegistrationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [recentWalkIns, setRecentWalkIns] = useState<RecentWalkIn[]>([]);
  const [chatWalkIn, setChatWalkIn] = useState<RecentWalkIn | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    idType: "",
    idNumber: "",
    vehicleNumber: "",
    purpose: "",
    recipientId: "",
  });

  useEffect(() => {
    fetch("/api/public/staff")
      .then((res) => res.json())
      .then((data) => setStaff(data))
      .catch(() => toast.error("Failed to load staff list"));
    fetchRecentWalkIns();
  }, []);

  async function fetchRecentWalkIns() {
    try {
      const res = await fetch("/api/walkins");
      if (res.ok) {
        const data = await res.json();
        setRecentWalkIns(data.slice(0, 20));
      }
    } catch { /* ignore */ }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/walkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      toast.success("Walk-in visitor registered. Waiting for recipient response...");
      fetchRecentWalkIns();
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        idType: "",
        idNumber: "",
        vehicleNumber: "",
        purpose: "",
        recipientId: "",
      });
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Register Walk-In Visitor</h1>
        <p className="text-muted-foreground">Register a visitor without a prior appointment</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Visitor Information
          </CardTitle>
          <CardDescription>Enter the visitor&apos;s details below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" value={formData.company} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input id="vehicleNumber" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>ID Type</Label>
                <Select value={formData.idType} onValueChange={(val) => setFormData((p) => ({ ...p, idType: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                    <SelectItem value="PASSPORT">Passport</SelectItem>
                    <SelectItem value="DRIVERS_LICENSE">Driver&apos;s License</SelectItem>
                    <SelectItem value="VOTER_ID">Voter ID</SelectItem>
                    <SelectItem value="COMPANY_ID">Company ID</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input id="idNumber" name="idNumber" value={formData.idNumber} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Who do you want to see? *</Label>
              <Select value={formData.recipientId} onValueChange={(val) => setFormData((p) => ({ ...p, recipientId: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} {s.department ? `(${s.department.name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of Visit *</Label>
              <Textarea id="purpose" name="purpose" value={formData.purpose} onChange={handleChange} required rows={3} />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register & Notify Recipient"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {recentWalkIns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Walk-In Requests</CardTitle>
            <CardDescription>Chat with staff about pending walk-ins</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentWalkIns.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">{w.visitor.firstName} {w.visitor.lastName}</p>
                  <p className="text-xs text-muted-foreground">
                    To: {w.recipient.firstName} {w.recipient.lastName} &middot; {w.purpose}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setChatWalkIn(w)}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Badge className={getStatusColor(w.decision)}>{w.decision}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {chatWalkIn && (
        <div className="max-w-lg">
          <LiveChat
            walkInRequestId={chatWalkIn.id}
            visitorName={`${chatWalkIn.visitor.firstName} ${chatWalkIn.visitor.lastName}`}
            onClose={() => setChatWalkIn(null)}
          />
        </div>
      )}
    </div>
  );
}
