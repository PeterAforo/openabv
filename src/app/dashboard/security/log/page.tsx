"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search } from "lucide-react";

interface LogEntry {
  id: string;
  purpose: string;
  recipientName: string | null;
  status: string;
  checkInTime: string;
  checkOutTime: string | null;
  isWalkIn: boolean;
  badgeNumber: string | null;
  visitor: { firstName: string; lastName: string; phone: string; company: string | null };
}

export default function SecurityLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/visitors/current?all=true");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setLogs(data.visitors || []);
      } catch {
        toast.error("Failed to load visitor log");
      } finally {
        setIsLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) =>
    `${l.visitor.firstName} ${l.visitor.lastName} ${l.visitor.phone}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visitor Log</h1>
        <p className="text-muted-foreground">Complete visitor check-in/out history</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search visitors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
      </div>

      <div className="space-y-2">
        {filtered.map((log) => (
          <Card key={log.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{log.visitor.firstName} {log.visitor.lastName}</p>
                    <Badge variant={log.status === "CHECKED_IN" ? "default" : "secondary"}>
                      {log.status === "CHECKED_IN" ? "Inside" : "Checked Out"}
                    </Badge>
                    {log.isWalkIn && <Badge variant="outline">Walk-In</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{log.visitor.phone}</p>
                  <p className="text-sm text-muted-foreground">Purpose: {log.purpose}</p>
                  {log.recipientName && <p className="text-sm text-muted-foreground">Visiting: {log.recipientName}</p>}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>In: {new Date(log.checkInTime).toLocaleString()}</p>
                  {log.checkOutTime && <p>Out: {new Date(log.checkOutTime).toLocaleString()}</p>}
                  {log.badgeNumber && <p>Badge: {log.badgeNumber}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card><CardContent className="py-8 text-center"><p className="text-muted-foreground">No visitor logs found</p></CardContent></Card>
        )}
      </div>
    </div>
  );
}
