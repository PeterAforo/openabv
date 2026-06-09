"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Col, Row, Segmented, Spin, Typography, Space, message } from "antd";
import { QrcodeOutlined, DownloadOutlined, CopyOutlined, IdcardOutlined, CalendarOutlined, FormOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";

const { Title, Text } = Typography;

interface QRData {
  qrCode: string;
  url: string;
  type: string;
  user: { firstName: string; lastName: string; department: string | null; title: string | null };
}

const qrTypes = [
  { label: "Business Card", value: "card", icon: <IdcardOutlined /> },
  { label: "Book Appointment", value: "book", icon: <CalendarOutlined /> },
  { label: "Pre-Register", value: "preregister", icon: <FormOutlined /> },
];

export default function StaffQRCodePage() {
  const { data: session } = useSession();
  const [qrData, setQRData] = useState<QRData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrType, setQRType] = useState("card");

  useEffect(() => {
    if (!session?.user?.id) return;
    setIsLoading(true);
    fetch(`/api/staff/${session.user.id}/qrcode?type=${qrType}`)
      .then(r => r.json())
      .then(setQRData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [session?.user?.id, qrType]);

  function downloadQR() {
    if (!qrData?.qrCode) return;
    const a = document.createElement("a");
    a.href = qrData.qrCode;
    a.download = `qr-${qrType}-${qrData.user.firstName}-${qrData.user.lastName}.png`;
    a.click();
  }

  function copyUrl() {
    if (!qrData?.url) return;
    navigator.clipboard.writeText(qrData.url);
    message.success("URL copied to clipboard");
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}><QrcodeOutlined /> My QR Codes</Title>
        <Text type="secondary">Share your QR code for visitors to scan</Text>
      </div>

      <Segmented
        options={qrTypes.map(t => ({ label: <Space size={4}>{t.icon}{t.label}</Space>, value: t.value }))}
        value={qrType}
        onChange={v => setQRType(v as string)}
        style={{ marginBottom: 24 }}
        block
      />

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}><Spin size="large" /></div>
      ) : qrData ? (
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Card style={{ textAlign: "center" }}>
              <img src={qrData.qrCode} alt="QR Code" style={{ width: 250, height: 250 }} />
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ fontSize: 16, color: "#0A2540" }}>
                  {qrType === "card" && "Business Card QR"}
                  {qrType === "book" && "Book Appointment QR"}
                  {qrType === "preregister" && "Pre-Register Visitor QR"}
                </Text>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12, wordBreak: "break-all" }}>{qrData.url}</Text>
              </div>
              <Space style={{ marginTop: 16 }}>
                <Button icon={<DownloadOutlined />} onClick={downloadQR}>Download</Button>
                <Button icon={<CopyOutlined />} onClick={copyUrl}>Copy URL</Button>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="How it works" style={{ height: "100%" }}>
              {qrType === "card" && (
                <div>
                  <Text>When scanned, this QR code shows your <strong>digital business card</strong> with:</Text>
                  <ul style={{ marginTop: 8, color: "#43474D" }}>
                    <li>Your name, title, and department</li>
                    <li>Contact details (email, phone)</li>
                    <li>Office location and extension</li>
                    <li>A button to book an appointment with you</li>
                  </ul>
                  <Text type="secondary">Print this on your business cards or display it at your desk.</Text>
                </div>
              )}
              {qrType === "book" && (
                <div>
                  <Text>When scanned, this QR code takes visitors directly to the <strong>appointment booking page</strong> with you pre-selected as the host.</Text>
                  <ul style={{ marginTop: 8, color: "#43474D" }}>
                    <li>Visitor verifies their phone number</li>
                    <li>Your name is pre-filled as the recipient</li>
                    <li>Visitor fills in their details and preferred time</li>
                    <li>You receive a notification for approval</li>
                  </ul>
                </div>
              )}
              {qrType === "preregister" && (
                <div>
                  <Text>When scanned, this QR code takes visitors to a <strong>pre-registration form</strong> where they can provide their details before arrival.</Text>
                  <ul style={{ marginTop: 8, color: "#43474D" }}>
                    <li>Visitor enters their personal details</li>
                    <li>Upload ID and photo in advance</li>
                    <li>Faster check-in at the kiosk on arrival day</li>
                  </ul>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      ) : (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <Text type="secondary">Unable to generate QR code. Please try again.</Text>
        </Card>
      )}
    </div>
  );
}
