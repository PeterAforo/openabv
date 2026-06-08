"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Card, Divider, Form, Input, Typography } from "antd";
import { GoogleOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import Link from "next/link";

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(values: { email: string; password: string }) {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Login successful");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#0A2540", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#00C48C", fontWeight: 700, fontSize: 18, marginBottom: 12 }}>VF</div>
          <Title level={3} style={{ margin: 0 }}>Welcome back</Title>
          <Text type="secondary">Sign in to your account</Text>
        </div>

        <Card>
          <Title level={5} style={{ marginBottom: 4 }}>Sign In</Title>
          <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>Enter your credentials to access the dashboard</Text>

          <Form layout="vertical" onFinish={onSubmit} disabled={isLoading}>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
              <Input prefix={<MailOutlined />} placeholder="admin@visitflow.io" size="large" />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={isLoading}>
              Sign In
            </Button>
          </Form>

          <Divider plain><Text type="secondary" style={{ fontSize: 12 }}>Or</Text></Divider>

          <Button
            block
            size="large"
            icon={<GoogleOutlined />}
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            disabled={isLoading}
          >
            Sign in with Google
          </Button>
        </Card>

        <p style={{ textAlign: "center", marginTop: 20, color: "#8c8c8c", fontSize: 14 }}>
          Need to book an appointment?{" "}
          <Link href="/book-appointment" style={{ color: "#0A2540" }}>Book here</Link>
        </p>
      </div>
    </div>
  );
}
