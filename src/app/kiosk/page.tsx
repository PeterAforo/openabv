"use client";

import { useState } from "react";
import { Button, Card, Input, Result, Spin, Descriptions, Tag, Segmented, Typography } from "antd";
import { CheckCircleOutlined, QrcodeOutlined, PhoneOutlined, NumberOutlined, WarningOutlined } from "@ant-design/icons";

interface KioskResult {
  found: boolean;
  sessionId?: string;
  message?: string;
  canWalkIn?: boolean;
  expired?: boolean;
  appointment?: {
    id: string;
    code: string;
    status: string;
    purpose: string;
    startTime: string;
    endTime: string;
  };
  visitor?: { firstName: string; lastName: string; phone: string; company?: string };
  host?: { firstName: string; lastName: string; department?: { name: string } };
}

type Step = "input" | "found" | "checking-in" | "done" | "not-found";

const { Title, Text } = Typography;

export default function KioskPage() {
  const [step, setStep] = useState<Step>("input");
  const [mode, setMode] = useState<"phone" | "code" | "qr">("phone");
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<KioskResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLookup() {
    if (!inputValue.trim()) return;
    setIsLoading(true);
    setError("");

    try {
      const payload: Record<string, string> = {};
      if (mode === "phone") payload.phone = inputValue;
      else if (mode === "code") payload.appointmentCode = inputValue;
      else payload.qrToken = inputValue;

      const res = await fetch("/api/kiosk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.found) {
        setResult(data);
        setStep("found");
      } else {
        setResult(data);
        setStep("not-found");
        if (data.expired) setError("Your QR code has expired. Please contact reception.");
        else if (data.message) setError(data.message);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setIsLoading(false);
  }

  async function handleCheckIn() {
    if (!result?.sessionId || !result?.appointment?.id) return;
    setStep("checking-in");
    try {
      const res = await fetch("/api/kiosk/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: result.sessionId, appointmentId: result.appointment.id }),
      });
      if (res.ok) {
        setStep("done");
      } else {
        const data = await res.json();
        setError(data.error || "Check-in failed");
        setStep("found");
      }
    } catch {
      setError("Check-in failed. Please contact reception.");
      setStep("found");
    }
  }

  function reset() {
    setStep("input");
    setInputValue("");
    setResult(null);
    setError("");
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0A2540 0%, #000F22 100%)", display: "flex", flexDirection: "column", fontFamily: "Inter, sans-serif", position: "relative", overflow: "hidden" }}>
      {/* Background decoration */}
      <div style={{ position: "absolute", top: "-10%", right: "-10%", width: 600, height: 600, borderRadius: "50%", border: "1px solid rgba(99,252,192,0.08)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: 900, height: 900, borderRadius: "50%", border: "1px solid rgba(99,252,192,0.04)", pointerEvents: "none" }} />

      {/* Top bar */}
      <div style={{ position: "relative", zIndex: 10, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#0A2540", border: "1px solid rgba(99,252,192,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <QrcodeOutlined style={{ fontSize: 20, color: "#00C48C" }} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>VisitFlow</div>
            <div style={{ fontSize: 10, color: "rgba(99,252,192,0.7)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Enterprise Suite</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00C48C", boxShadow: "0 0 8px rgba(0,196,140,0.8)" }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em" }}>System Online</span>
        </div>
      </div>

      {/* Main content */}
      <main style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 24, padding: 40, width: "100%", maxWidth: 480, boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#00C48C", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 8px 32px rgba(0,196,140,0.3)" }}>
              <QrcodeOutlined style={{ fontSize: 32, color: "#fff" }} />
            </div>
            <Title level={3} style={{ margin: "0 0 4px", color: "#0A2540" }}>Visitor Self Check-In</Title>
            <Text type="secondary">Welcome! Please verify your appointment below.</Text>
          </div>

          {/* INPUT STEP */}
          {step === "input" && (
            <div>
              <Segmented
                block
                value={mode}
                onChange={(v) => { setMode(v as "phone" | "code" | "qr"); setInputValue(""); }}
                options={[
                  { label: <><PhoneOutlined /> Phone</>, value: "phone" },
                  { label: <><NumberOutlined /> Code</>, value: "code" },
                  { label: <><QrcodeOutlined /> QR</>, value: "qr" },
                ]}
                style={{ marginBottom: 16 }}
              />

              <Input
                size="large"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  mode === "phone" ? "Enter your phone number" :
                  mode === "code" ? "Enter appointment code" :
                  "Scan or paste QR token"
                }
                onPressEnter={handleLookup}
                autoFocus
                style={{ textAlign: "center", marginBottom: 12, borderRadius: 10, border: "1px solid #C4C6CE" }}
              />

              {error && <Text type="danger" style={{ display: "block", textAlign: "center", marginBottom: 12 }}>{error}</Text>}

              <Button type="primary" block size="large" loading={isLoading} onClick={handleLookup} disabled={!inputValue.trim()} style={{ borderRadius: 10, height: 48, background: "#0A2540", borderColor: "#0A2540", fontWeight: 600 }}>
                Look Up Appointment
              </Button>
            </div>
          )}

          {/* FOUND STEP */}
          {step === "found" && result && (
            <div>
              <Result status="success" title="Appointment Found!" style={{ padding: "12px 0" }} />

              <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Name">{result.visitor?.firstName} {result.visitor?.lastName}</Descriptions.Item>
                <Descriptions.Item label="Host">{result.host?.firstName} {result.host?.lastName}</Descriptions.Item>
                {result.host?.department && <Descriptions.Item label="Department">{result.host.department.name}</Descriptions.Item>}
                <Descriptions.Item label="Purpose">{result.appointment?.purpose}</Descriptions.Item>
                <Descriptions.Item label="Time">
                  {result.appointment?.startTime && new Date(result.appointment.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {result.appointment?.endTime && new Date(result.appointment.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Descriptions.Item>
                <Descriptions.Item label="Status"><Tag color="blue">{result.appointment?.status}</Tag></Descriptions.Item>
              </Descriptions>

              {error && <Text type="danger" style={{ display: "block", textAlign: "center", marginBottom: 12 }}>{error}</Text>}

              <div style={{ display: "flex", gap: 12 }}>
                <Button block onClick={reset} style={{ borderRadius: 10, height: 44 }}>Back</Button>
                <Button type="primary" block style={{ background: "#00C48C", borderColor: "#00C48C", borderRadius: 10, height: 44, fontWeight: 600 }} onClick={handleCheckIn}>Confirm Check-In</Button>
              </div>
            </div>
          )}

          {/* CHECKING IN */}
          {step === "checking-in" && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Spin size="large" />
              <p style={{ marginTop: 16, fontSize: 16, color: "#0A2540" }}>Processing check-in...</p>
            </div>
          )}

          {/* DONE */}
          {step === "done" && (
            <div>
              <Result
                status="success"
                icon={<CheckCircleOutlined style={{ color: "#00C48C" }} />}
                title="Check-In Successful!"
                subTitle="Please wait for security to verify your identity. You will be directed to your host shortly."
              />
              <Button block onClick={reset} style={{ borderRadius: 10, height: 44 }}>New Check-In</Button>
            </div>
          )}

          {/* NOT FOUND */}
          {step === "not-found" && (
            <div>
              <Result
                status="warning"
                icon={<WarningOutlined />}
                title="No Appointment Found"
                subTitle={error || "We couldn't find a matching appointment."}
              />
              {result?.canWalkIn && <Text type="secondary" style={{ display: "block", textAlign: "center", marginBottom: 12 }}>Please visit the reception desk to register as a walk-in visitor.</Text>}
              <Button block onClick={reset} style={{ borderRadius: 10, height: 44 }}>Try Again</Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <div style={{ position: "relative", zIndex: 10, padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
        <span>Terminal ID: VF-LOBBY-01 • v2.4.1</span>
        <span>{new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
      </div>
    </div>
  );
}
