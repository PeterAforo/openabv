"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search } from "lucide-react";

interface HistoryEntry {
  id: string;
  appointmentCode: string;
  status: string;
  date: string;
  startTime: string;
  purpose: string;
  visitor: { firstName: string; lastName: string; phone: string };
}

export default function StaffHistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/appointments?status=COMPLETED");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setHistory(data.appointments || []);
      } catch {
        toast.error("Failed to load history");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = history.filter((h) =>
    `${h.visitor.firstName} ${h.visitor.lastName} ${h.appointmentCode}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visitor History</h1>
        <p className="text-muted-foreground">Past completed appointments</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
      </div>

      <div className="space-y-2">
        {filtered.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{entry.visitor.firstName} {entry.visitor.lastName}</p>
                    <Badge variant="secondary">{entry.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">{entry.appointmentCode}</p>
                  <p className="text-sm text-muted-foreground">Purpose: {entry.purpose}</p>
                </div>
                <p className="text-sm text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card><CardContent className="py-8 text-center"><p className="text-muted-foreground">No history found</p></CardContent></Card>
        )}
      </div>
    </div>
  );
}
