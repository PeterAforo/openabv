"use client";

import { useState } from "react";
import { Button, Card, Input, Result, Alert, Descriptions, Typography, Tag } from "antd";
import { ScanOutlined, QrcodeOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface ScanResult {
  valid: boolean;
  checkedIn?: boolean;
  expired?: boolean;
  alreadyCheckedIn?: boolean;
  watchlistAlert?: boolean;
  error?: string;
  visitorLogId?: string;
  appointment?: { id: string; code: string; purpose: string; status?: string };
  visitor?: { name: string; phone: string; company?: string; photo?: string };
  host?: { firstName: string; lastName: string; department?: { name: string } };
  branch?: { name: string };
  watchlistWarning?: { riskLevel: string; reason: string } | null;
}

export default function ScanQRPage() {
  const [qrToken, setQrToken] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  async function handleScan() {
    if (!qrToken.trim()) return;
    setIsScanning(true);
    setResult(null);

    try {
      const res = await fetch("/api/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: qrToken.trim() }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false, error: "Scan failed. Try again." });
    }
    setIsScanning(false);
  }

  function reset() {
    setQrToken("");
    setResult(null);
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}><ScanOutlined /> QR Code Scanner</Title>
        <Text type="secondary">Scan visitor QR code to check them in</Text>
      </div>

      <Card title={<><QrcodeOutlined /> Enter QR Token</>} style={{ marginBottom: 24 }}>
        <Input
          size="large"
          value={qrToken}
          onChange={(e) => setQrToken(e.target.value)}
          placeholder="Scan or paste QR code token..."
          onPressEnter={handleScan}
          autoFocus
          style={{ marginBottom: 12 }}
        />
        <Button type="primary" block loading={isScanning} onClick={handleScan} disabled={!qrToken.trim()}>
          Verify & Check In
        </Button>
      </Card>

      {/* Result */}
      {result && (
        <Card>
          {/* Success */}
          {result.checkedIn && (
            <div>
              <Result status="success" title="Visitor Checked In" style={{ padding: "12px 0" }} />
              <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Visitor">{result.visitor?.name}</Descriptions.Item>
                <Descriptions.Item label="Phone">{result.visitor?.phone}</Descriptions.Item>
                {result.visitor?.company && <Descriptions.Item label="Company">{result.visitor.company}</Descriptions.Item>}
                <Descriptions.Item label="Host">{result.host?.firstName} {result.host?.lastName}</Descriptions.Item>
                {result.host?.department && <Descriptions.Item label="Dept">{result.host.department.name}</Descriptions.Item>}
                <Descriptions.Item label="Purpose">{result.appointment?.purpose}</Descriptions.Item>
              </Descriptions>

              {result.watchlistWarning && (
                <Alert
                  type="warning"
                  message="Watchlist Match"
                  description={`Risk: ${result.watchlistWarning.riskLevel} - ${result.watchlistWarning.reason}`}
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Button block onClick={reset}>Scan Next</Button>
            </div>
          )}

          {/* Watchlist block */}
          {!result.checkedIn && result.valid && result.watchlistAlert && (
            <div style={{ textAlign: "center" }}>
              <Result status="error" title="SECURITY ALERT" subTitle={result.error} />
              <Tag color="red" style={{ fontSize: 14, padding: "4px 12px" }}>Critical Risk</Tag>
              <Button block onClick={reset} style={{ marginTop: 16 }}>Dismiss</Button>
            </div>
          )}

          {/* Invalid / Error */}
          {!result.valid && !result.checkedIn && (
            <div>
              <Result
                status="error"
                title={result.expired ? "QR Expired" : result.alreadyCheckedIn ? "Already Checked In" : "Invalid QR"}
                subTitle={result.error}
              />
              <Button block onClick={reset}>Try Again</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
