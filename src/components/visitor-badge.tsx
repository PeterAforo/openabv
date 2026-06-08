"use client";

import { useEffect, useState, useRef } from "react";
import { Button, Spin, Typography } from "antd";
import { PrinterOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface BadgeData {
  id: string;
  badgeNumber: string;
  visitor: { name: string; company?: string; photo?: string; type: string };
  host: string;
  department: string;
  branch: string;
  checkInTime: string;
  expiresAt: string;
  qrToken: string;
  purpose: string;
}

export function VisitorBadge({ visitorLogId }: { visitorLogId: string }) {
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchBadge() {
      try {
        const res = await fetch(`/api/badges?visitorLogId=${visitorLogId}`);
        if (res.ok) setBadge(await res.json());
      } catch { /* ignore */ }
      setIsLoading(false);
    }
    fetchBadge();
  }, [visitorLogId]);

  function handlePrint() {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Visitor Badge</title>
      <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        .badge { width: 350px; padding: 20px; border: 2px solid #333; border-radius: 12px; margin: 20px auto; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 12px; }
        .header h1 { font-size: 16px; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
        .header p { font-size: 11px; margin: 4px 0 0; color: #666; }
        .photo { width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 10px; background: #eee; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .photo img { width: 100%; height: 100%; object-fit: cover; }
        .name { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 4px; }
        .company { text-align: center; font-size: 12px; color: #666; margin-bottom: 12px; }
        .details { font-size: 12px; }
        .details .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee; }
        .details .label { font-weight: bold; color: #333; }
        .badge-number { text-align: center; font-size: 24px; font-weight: bold; color: #333; margin-top: 12px; letter-spacing: 2px; }
        .expiry { text-align: center; font-size: 10px; color: #999; margin-top: 8px; }
        .type-badge { display: inline-block; padding: 2px 8px; background: #e0f2fe; border-radius: 4px; font-size: 10px; font-weight: bold; }
        @media print { body { margin: 0; } }
      </style></head><body>
      ${printRef.current.innerHTML}
      <script>window.onload = function() { window.print(); window.close(); }</script>
      </body></html>
    `);
    printWindow.document.close();
  }

  if (isLoading) return <div style={{ textAlign: "center", padding: 20 }}><Spin /></div>;
  if (!badge) return <Text type="danger">Badge not available</Text>;

  return (
    <div>
      <div ref={printRef}>
        <div className="badge">
          <div className="header">
            <h1>Visitor Pass</h1>
            <p>{badge.branch}</p>
          </div>
          <div className="photo">
            {badge.visitor.photo ? (
              <img src={badge.visitor.photo} alt="Visitor" />
            ) : (
              <span style={{ fontSize: "24px", color: "#999" }}>👤</span>
            )}
          </div>
          <div className="name">{badge.visitor.name}</div>
          {badge.visitor.company && <div className="company">{badge.visitor.company}</div>}
          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <span className="type-badge">{badge.visitor.type}</span>
          </div>
          <div className="details">
            <div className="row"><span className="label">Host:</span><span>{badge.host}</span></div>
            <div className="row"><span className="label">Department:</span><span>{badge.department}</span></div>
            <div className="row"><span className="label">Purpose:</span><span>{badge.purpose}</span></div>
            <div className="row"><span className="label">Check-In:</span><span>{new Date(badge.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
          </div>
          <div className="badge-number">{badge.badgeNumber}</div>
          <div className="expiry">Expires: {new Date(badge.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} today</div>
        </div>
      </div>

      <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint} block style={{ marginTop: 16 }}>
        Print Badge
      </Button>
    </div>
  );
}
