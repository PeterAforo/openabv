"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, MessageCircle } from "lucide-react";
import { getStatusColor } from "@/lib/utils";
import LiveChat from "@/components/dashboard/live-chat";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  department: { name: string } | null;
}

interface RecentWalkIn {
  id: string;
  decision: string;
  purpose: string;
  createdAt: string;
  visitor: { firstName: string; lastName: string; phone: string };
  recipient: { firstName: string; lastName: string };
}

export default function ReceptionistWalkinPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentWalkIns, setRecentWalkIns] = useState<RecentWalkIn[]>([]);
  const [chatWalkIn, setChatWalkIn] = useState<RecentWalkIn | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    company: "",
    idType: "NATIONAL_ID",
    idNumber: "",
    recipientId: "",
    purpose: "",
  });

  useEffect(() => {
    async function loadStaff() {
      try {
        const res = await fetch("/api/public/staff");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setStaff(data.staff || []);
      } catch {
        toast.error("Failed to load staff list");
      }
    }
    loadStaff();
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone || !form.recipientId || !form.purpose) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/walkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Registration failed");
        return;
      }
      toast.success("Walk-in registered. Notification sent to recipient.");
      fetchRecentWalkIns();
      setForm({ firstName: "", lastName: "", phone: "", email: "", company: "", idType: "NATIONAL_ID", idNumber: "", recipientId: "", purpose: "" });
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Walk-In Registration</h1>
        <p className="text-muted-foreground">Register walk-in visitors and notify staff</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Visitor Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} required />
              </div>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>ID Type</Label>
                <Select value={form.idType} onValueChange={(val) => setForm((p) => ({ ...p, idType: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                    <SelectItem value="PASSPORT">Passport</SelectItem>
                    <SelectItem value="DRIVERS_LICENSE">Driver&apos;s License</SelectItem>
                    <SelectItem value="VOTER_ID">Voter ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ID Number</Label>
                <Input value={form.idNumber} onChange={(e) => setForm((p) => ({ ...p, idNumber: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Who are you visiting? *</Label>
              <Select value={form.recipientId} onValueChange={(val) => setForm((p) => ({ ...p, recipientId: val }))}>
                <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}{s.department ? ` (${s.department.name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Purpose *</Label>
              <Textarea value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} required />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              {isSubmitting ? "Registering..." : "Register Walk-In"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {recentWalkIns.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Walk-Ins</CardTitle></CardHeader>
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
