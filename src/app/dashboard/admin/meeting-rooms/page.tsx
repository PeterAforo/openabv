"use client";

import { useState, useEffect } from "react";
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Tag, Typography, Spin, Space } from "antd";
import { PlusOutlined, TeamOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface MeetingRoom {
  id: string;
  name: string;
  floor?: string;
  capacity: number;
  amenities?: string;
  status: string;
  branch?: { name: string };
  bookings: { id: string; title: string; startTime: string; endTime: string }[];
}

const statusTagColor: Record<string, string> = {
  AVAILABLE: "success",
  OCCUPIED: "error",
  MAINTENANCE: "warning",
  RESERVED: "processing",
};

export default function MeetingRoomsPage() {
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [antForm] = Form.useForm();

  useEffect(() => { fetchRooms(); }, []);

  async function fetchRooms() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/rooms");
      if (res.ok) setRooms(await res.json());
    } catch { /* ignore */ }
    setIsLoading(false);
  }

  async function handleAdd(values: { name: string; floor?: string; capacity: number }) {
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        setShowAdd(false);
        antForm.resetFields();
        fetchRooms();
      }
    } catch { /* ignore */ }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Meeting Rooms</Title>
          <Text type="secondary">Manage rooms and bookings</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>Add Room</Button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}><Spin size="large" /></div>
      ) : (
        <Row gutter={[16, 16]}>
          {rooms.map((room) => {
            const amenities = room.amenities ? JSON.parse(room.amenities) : [];
            return (
              <Col xs={24} sm={12} lg={8} key={room.id}>
                <Card
                  hoverable
                  title={room.name}
                  extra={<Tag color={statusTagColor[room.status] || "default"}>{room.status}</Tag>}
                >
                  <Space direction="vertical" size={4} style={{ width: "100%" }}>
                    <Text type="secondary"><TeamOutlined /> Capacity: {room.capacity}{room.floor && ` · ${room.floor}`}</Text>
                    {amenities.length > 0 && (
                      <div>{amenities.map((a: string) => <Tag key={a} color="blue" style={{ marginBottom: 4 }}>{a}</Tag>)}</div>
                    )}
                    {room.bookings.length > 0 && (
                      <div style={{ marginTop: 8, borderTop: "1px solid #f0f0f0", paddingTop: 8 }}>
                        <Text strong style={{ fontSize: 12 }}>Upcoming:</Text>
                        {room.bookings.slice(0, 3).map((b) => (
                          <div key={b.id}><Text type="secondary" style={{ fontSize: 12 }}>{b.title} · {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}-{new Date(b.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text></div>
                        ))}
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal title="Add Meeting Room" open={showAdd} onCancel={() => setShowAdd(false)} footer={null} destroyOnClose>
        <Form form={antForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="name" label="Room Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Board Room A" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="floor" label="Floor"><Input placeholder="e.g. 2nd Floor" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="capacity" label="Capacity" initialValue={4}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" block>Create Room</Button>
        </Form>
      </Modal>
    </div>
  );
}
