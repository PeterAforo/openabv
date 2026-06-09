"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Form, Input } from "antd";
import {
  GoogleOutlined,
  LockOutlined,
  MailOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  EyeOutlined,
  RadarChartOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import Link from "next/link";

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
    <main style={{ display: "flex", minHeight: "100vh", width: "100%", fontFamily: "Inter, sans-serif" }}>
      {/* Left Panel: Brand Experience */}
      <section className="vf-login-left" style={{ display: "flex", flexDirection: "column", width: "50%", background: "linear-gradient(135deg, #0A2540 0%, #000F22 100%)", padding: 32, position: "relative", overflow: "hidden", justifyContent: "space-between" }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-10%", right: "-10%", width: 500, height: 500, borderRadius: "50%", border: "1px solid rgba(99,252,192,0.15)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: 800, height: 800, borderRadius: "50%", border: "1px solid rgba(99,252,192,0.06)", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, background: "#fff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SafetyCertificateOutlined style={{ fontSize: 28, color: "#00C48C" }} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>VisitFlow</div>
            <div style={{ fontSize: 12, color: "rgba(118,141,173,0.8)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>Enterprise Suite</div>
          </div>
        </div>

        {/* Center: Glass panel + features */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 32, maxWidth: 460, width: "100%", marginBottom: 32 }}>
            {/* Feature illustration placeholder */}
            <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 10, background: "linear-gradient(135deg, rgba(0,196,140,0.15) 0%, rgba(10,37,64,0.6) 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, position: "relative", overflow: "hidden" }}>
              <div style={{ textAlign: "center", zIndex: 1 }}>
                <SafetyCertificateOutlined style={{ fontSize: 48, color: "#00C48C", opacity: 0.8 }} />
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 8 }}>Enterprise-Grade Security</div>
              </div>
              <div style={{ position: "absolute", bottom: 12, left: 16, display: "flex", alignItems: "center", gap: 6 }}>
                <LockOutlined style={{ color: "#63FCC0", fontSize: 14 }} />
                <span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>SSL 256-bit Encrypted</span>
              </div>
            </div>
            {/* Feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: <EyeOutlined style={{ color: "#63FCC0", fontSize: 18 }} />, text: "Biometric Identity Verification" },
                { icon: <RadarChartOutlined style={{ color: "#63FCC0", fontSize: 18 }} />, text: "Real-time Visitor Tracking" },
                { icon: <AuditOutlined style={{ color: "#63FCC0", fontSize: 18 }} />, text: "Automated Compliance Logs" },
              ].map((f) => (
                <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 16, color: "rgba(118,141,173,0.9)" }}>
                  <CheckCircleFilled style={{ color: "#63FCC0", fontSize: 18 }} />
                  <span style={{ fontSize: 14 }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.625rem)", fontWeight: 700, color: "#fff", textAlign: "center", maxWidth: 420, lineHeight: 1.15, letterSpacing: "-0.02em", margin: 0 }}>
            Smart Appointments.{" "}
            <br />
            <span style={{ color: "#63FCC0" }}>Secure Access.</span>
          </h2>
        </div>

        {/* Footer */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", color: "rgba(118,141,173,0.7)", fontSize: 11 }}>
          <span>© {new Date().getFullYear()} VisitFlow. All Rights Reserved.</span>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Privacy</a>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Terms</a>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Security</a>
          </div>
        </div>
      </section>

      {/* Right Panel: Login Form */}
      <section style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 24px", background: "#F7F9FB" }}>
        <div style={{ maxWidth: 440, width: "100%" }}>
          {/* Mobile Logo */}
          <div className="vf-login-mobile-logo" style={{ display: "none", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SafetyCertificateOutlined style={{ fontSize: 22, color: "#00C48C" }} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 22, color: "#0A2540" }}>VisitFlow</span>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700, color: "#0A2540", margin: 0, lineHeight: 1.25, letterSpacing: "-0.01em" }}>Welcome back</h2>
            <p style={{ fontSize: 16, color: "#43474D", marginTop: 8, lineHeight: 1.5 }}>Please enter your credentials to access the console.</p>
          </div>

          <Form layout="vertical" onFinish={onSubmit} disabled={isLoading} requiredMark={false}>
            <Form.Item name="email" label={<span style={{ fontSize: 12, fontWeight: 500, color: "#0A2540", letterSpacing: "0.01em" }}>Work Email</span>} rules={[{ required: true, type: "email", message: "Please enter a valid email" }]}>
              <Input
                prefix={<MailOutlined style={{ color: "#74777E" }} />}
                placeholder="name@company.com"
                size="large"
                style={{ borderRadius: 10, border: "1px solid #C4C6CE", background: "#fff", padding: "10px 12px" }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#0A2540", letterSpacing: "0.01em" }}>Password</span>
                  <a href="#" style={{ fontSize: 12, fontWeight: 600, color: "#006C4B" }}>Forgot Password?</a>
                </div>
              }
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#74777E" }} />}
                placeholder="••••••••"
                size="large"
                style={{ borderRadius: 10, border: "1px solid #C4C6CE", background: "#fff", padding: "10px 12px" }}
              />
            </Form.Item>

            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <input type="checkbox" id="remember" style={{ width: 18, height: 18, borderRadius: 4, cursor: "pointer", accentColor: "#006C4B" }} />
              <label htmlFor="remember" style={{ fontSize: 14, color: "#43474D", cursor: "pointer", userSelect: "none" }}>Remember this device for 30 days</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ width: "100%", padding: "12px 24px", background: "#0A2540", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 16, cursor: isLoading ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: isLoading ? 0.7 : 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </Form>

          {/* Divider */}
          <div style={{ position: "relative", margin: "32px 0", display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1, height: 1, background: "#C4C6CE" }} />
            <span style={{ padding: "0 16px", fontSize: 12, fontWeight: 500, color: "#74777E", textTransform: "uppercase", letterSpacing: "0.08em" }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: "#C4C6CE" }} />
          </div>

          {/* SSO Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              disabled={isLoading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px 16px", border: "1px solid #C4C6CE", borderRadius: 10, background: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 600, color: "#191C1E", transition: "background 0.15s" }}
            >
              <GoogleOutlined style={{ fontSize: 18 }} />
              Google
            </button>
            <button
              type="button"
              disabled={isLoading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px 16px", border: "1px solid #C4C6CE", borderRadius: 10, background: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 600, color: "#191C1E", transition: "background 0.15s" }}
            >
              <SafetyCertificateOutlined style={{ fontSize: 18, color: "#0A2540" }} />
              SSO
            </button>
          </div>

          <p style={{ marginTop: 32, textAlign: "center", fontSize: 14, color: "#43474D" }}>
            Facing issues signing in?{" "}
            <Link href="/book-appointment" style={{ color: "#006C4B", fontWeight: 600, textDecoration: "none" }}>Contact System Admin</Link>
          </p>
        </div>
      </section>

      <style jsx global>{`
        @media (max-width: 1023px) {
          .vf-login-left { display: none !important; }
          .vf-login-mobile-logo { display: flex !important; }
        }
      `}</style>
    </main>
  );
}
