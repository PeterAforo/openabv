"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";

interface StaffOption {
  id: string;
  firstName: string;
  lastName: string;
  department?: { name: string } | null;
}

interface DepartmentOption {
  id: string;
  name: string;
}

export default function BookAppointmentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [appointmentCode, setAppointmentCode] = useState("");
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    recipientId: "",
    departmentId: "",
    purpose: "",
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/public/staff")
      .then((res) => res.json())
      .then((data) => setStaff(data))
      .catch(() => toast.error("Failed to load staff list"));

    fetch("/api/public/departments")
      .then((res) => res.json())
      .then((data) => setDepartments(data))
      .catch(() => toast.error("Failed to load departments"));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to book appointment");
        return;
      }

      setAppointmentCode(data.appointmentCode);
      setSuccess(true);
      toast.success("Appointment booked successfully!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle>Appointment Booked!</CardTitle>
            <CardDescription>Your appointment has been submitted for approval</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Your reference code</p>
              <p className="text-2xl font-bold font-mono mt-1">{appointmentCode}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Please save this code. You&apos;ll need it when you arrive.
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href={`/appointment-status?code=${appointmentCode}`}>
                  Check Status
                </Link>
              </Button>
              <Button variant="outline" onClick={() => { setSuccess(false); setFormData({ firstName: "", lastName: "", email: "", phone: "", company: "", recipientId: "", departmentId: "", purpose: "", date: "", startTime: "", endTime: "", notes: "" }); }}>
                Book Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">OA</span>
            </div>
            <span className="text-xl font-bold">OpenABV</span>
          </Link>
          <h1 className="text-3xl font-bold">Book an Appointment</h1>
          <p className="text-muted-foreground mt-2">Fill in the form below to schedule your visit</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
            <CardDescription>All fields marked with * are required</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
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
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company / Organization</Label>
                <Input id="company" name="company" value={formData.company} onChange={handleChange} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={formData.departmentId} onValueChange={(val) => setFormData((p) => ({ ...p, departmentId: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Who do you want to see? *</Label>
                  <Select value={formData.recipientId} onValueChange={(val) => setFormData((p) => ({ ...p, recipientId: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select person" />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Visit *</Label>
                <Textarea id="purpose" name="purpose" value={formData.purpose} onChange={handleChange} required rows={3} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Preferred Date *</Label>
                  <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required min={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input id="startTime" name="startTime" type="time" value={formData.startTime} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input id="endTime" name="endTime" type="time" value={formData.endTime} onChange={handleChange} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={2} />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Booking..." : "Book Appointment"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have a reference code?{" "}
          <Link href="/appointment-status" className="text-primary hover:underline font-medium">
            Check your status
          </Link>
        </p>
      </div>
    </div>
  );
}
