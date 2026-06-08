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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e6f4ff 0%, #f0f5ff 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <Card style={{ width: "100%", maxWidth: 480, boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <QrcodeOutlined style={{ fontSize: 40, color: "#0A2540" }} />
          <Title level={3} style={{ margin: "8px 0 0" }}>Visitor Self Check-In</Title>
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
              style={{ textAlign: "center", marginBottom: 12 }}
            />

            {error && <Text type="danger" style={{ display: "block", textAlign: "center", marginBottom: 12 }}>{error}</Text>}

            <Button type="primary" block size="large" loading={isLoading} onClick={handleLookup} disabled={!inputValue.trim()}>
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
              <Button block onClick={reset}>Back</Button>
              <Button type="primary" block style={{ background: "#52c41a", borderColor: "#52c41a" }} onClick={handleCheckIn}>Confirm Check-In</Button>
            </div>
          </div>
        )}

        {/* CHECKING IN */}
        {step === "checking-in" && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, fontSize: 16 }}>Processing check-in...</p>
          </div>
        )}

        {/* DONE */}
        {step === "done" && (
          <div>
            <Result
              status="success"
              icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              title="Check-In Successful!"
              subTitle="Please wait for security to verify your identity. You will be directed to your host shortly."
            />
            <Button block onClick={reset}>New Check-In</Button>
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
            <Button block onClick={reset}>Try Again</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
