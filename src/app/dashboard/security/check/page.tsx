"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStatusColor } from "@/lib/utils";
import { Search, UserCheck, QrCode } from "lucide-react";

interface SearchResult {
  id: string;
  appointmentCode: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  visitor: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    company?: string;
  };
  recipient: { firstName: string; lastName: string };
}

export default function SecurityCheckPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/visitors/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Search failed");
        return;
      }

      setResults(data);
      if (data.length === 0) {
        toast.info("No appointments found for today");
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleCheckIn(appointment: SearchResult) {
    setIsCheckingIn(true);
    try {
      const res = await fetch("/api/visitors/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          visitorId: appointment.visitor.id,
          purpose: appointment.purpose,
          recipientName: `${appointment.recipient.firstName} ${appointment.recipient.lastName}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Check-in failed");
        return;
      }

      toast.success(`${appointment.visitor.firstName} ${appointment.visitor.lastName} checked in successfully`);
      // Update results to show checked-in status
      setResults((prev) =>
        prev.map((r) => (r.id === appointment.id ? { ...r, status: "CHECKED_IN" } : r))
      );
    } catch {
      toast.error("Check-in failed");
    } finally {
      setIsCheckingIn(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Check Appointment</h1>
        <p className="text-muted-foreground">Search by name, phone, reference code, or QR code</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Visitor
          </CardTitle>
          <CardDescription>Enter a reference code, name, or phone number</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSearch} className="flex gap-2">
            <Input
              placeholder="Reference code, name, or phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
            <Button type="button" variant="outline" size="icon" title="Scan QR Code">
              <QrCode className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Results ({results.length})</h2>
          {results.map((result) => (
            <Card key={result.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {result.visitor.firstName} {result.visitor.lastName}
                      </p>
                      <Badge className={getStatusColor(result.status)}>{result.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Code: <span className="font-mono">{result.appointmentCode}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Meeting: {result.recipient.firstName} {result.recipient.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Time: {new Date(result.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {new Date(result.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-sm text-muted-foreground">Purpose: {result.purpose}</p>
                    {result.visitor.company && (
                      <p className="text-sm text-muted-foreground">Company: {result.visitor.company}</p>
                    )}
                  </div>
                  <div>
                    {result.status === "APPROVED" && (
                      <Button
                        onClick={() => handleCheckIn(result)}
                        disabled={isCheckingIn}
                        className="gap-2"
                      >
                        <UserCheck className="h-4 w-4" />
                        Check In
                      </Button>
                    )}
                    {result.status === "CHECKED_IN" && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Already Checked In
                      </Badge>
                    )}
                    {result.status === "PENDING" && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Pending Approval
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
