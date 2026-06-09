"use client";

import Link from "next/link";
import {
  CalendarOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  QrcodeOutlined,
  ThunderboltOutlined,
  LockOutlined,
} from "@ant-design/icons";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "Inter, sans-serif" }}>
      {/* Navigation */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(247,249,251,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(229,231,235,0.3)", padding: "0 16px" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SafetyCertificateOutlined style={{ fontSize: 24, color: "#00C48C" }} />
            <span style={{ fontSize: 20, fontWeight: 600, color: "#0A2540", letterSpacing: "-0.01em" }}>VisitFlow</span>
          </div>
          <div className="vf-nav-links" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/appointment-status" className="vf-nav-link-desktop" style={{ fontSize: 12, fontWeight: 500, color: "#43474D", textDecoration: "none" }}>Check Status</Link>
            <Link href="/ai-assistant" className="vf-nav-link-desktop" style={{ fontSize: 12, fontWeight: 500, color: "#43474D", textDecoration: "none" }}>AI Assistant</Link>
            <Link href="/login" style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", padding: "6px 12px" }}>Login</Link>
            <Link href="/book-appointment" style={{ fontSize: 12, fontWeight: 700, color: "#fff", textDecoration: "none", padding: "8px 16px", background: "#0A2540", borderRadius: 10 }}>Book Demo</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ paddingTop: 64, background: "radial-gradient(circle at top right, #006C4B 0%, #0A2540 60%)", position: "relative", overflow: "hidden" }}>
        <div className="vf-hero-grid" style={{ maxWidth: 1440, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, padding: "80px 24px", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", background: "rgba(0,196,140,0.2)", border: "1px solid rgba(0,196,140,0.3)", borderRadius: 999, color: "#63FCC0", fontSize: 12, fontWeight: 500, width: "fit-content" }}>
              <ThunderboltOutlined style={{ fontSize: 12 }} />
              Enterprise Visitor Management 2.0
            </div>
            <h1 className="vf-hero-heading" style={{ fontSize: 48, fontWeight: 700, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", margin: 0, maxWidth: 520 }}>
              Smart Appointments.{" "}
              <br />
              <span style={{ color: "#63FCC0" }}>Secure Access.</span>
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, margin: 0, maxWidth: 500 }}>
              Transform your reception into a high-security portal. Streamline visitor registration, automate compliance, and ensure facility safety with our intelligent cloud-based suite.
            </p>
            <div className="vf-hero-cta" style={{ display: "flex", flexWrap: "wrap", gap: 12, paddingTop: 8 }}>
              <Link href="/book-appointment" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "#00C48C", color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: "0 8px 24px rgba(0,196,140,0.3)" }}>
                Book Appointment <ArrowRightOutlined />
              </Link>
              <Link href="/appointment-status" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>
                Track Appointment
              </Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 24, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)", margin: 0 }}>Trusted by 500+ global enterprises including Fortune 100 leaders.</p>
            </div>
          </div>
          {/* Right side: visual placeholder */}
          <div className="vf-hero-right" style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 440 }}>
              <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: 12, background: "linear-gradient(135deg, rgba(0,196,140,0.1) 0%, rgba(10,37,64,0.4) 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <QrcodeOutlined style={{ fontSize: 64, color: "rgba(99,252,192,0.5)" }} />
                <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <LockOutlined style={{ color: "#63FCC0", fontSize: 14 }} />
                  <span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>End-to-end encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section style={{ padding: "32px 16px", background: "#F2F4F6" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: 12, fontWeight: 500, color: "#74777E", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24 }}>Certified Security & Compliance</p>
          <div className="vf-trust-badges" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 24, opacity: 0.7 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13, color: "#0A2540" }}><SafetyCertificateOutlined /> SOC2 TYPE II</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13, color: "#0A2540" }}><LockOutlined /> GDPR READY</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13, color: "#0A2540" }}><SafetyCertificateOutlined /> ISO 27001</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13, color: "#0A2540" }}><CheckCircleOutlined /> HIPAA COMPLIANT</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "64px 16px", background: "#fff" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
            <h2 className="vf-section-heading" style={{ fontSize: 32, fontWeight: 700, color: "#0A2540", margin: 0, letterSpacing: "-0.01em" }}>Engineered for Operational Velocity</h2>
            <p style={{ fontSize: 15, color: "#43474D", marginTop: 12, lineHeight: 1.6 }}>Eliminate the friction of traditional visitor logs with a system that prioritizes security without compromising on the guest experience.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {/* Feature 1 */}
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(0,108,75,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <QrcodeOutlined style={{ fontSize: 24, color: "#006C4B" }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#0A2540", margin: 0 }}>Instant QR Check-ins</h3>
              <p style={{ fontSize: 14, color: "#43474D", lineHeight: 1.6, margin: 0 }}>Visitors receive a secure QR code via email prior to their arrival. A simple scan at the kiosk completes check-in in under 10 seconds.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: "#006C4B" }}><CheckCircleOutlined /> Touchless registration</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: "#006C4B" }}><CheckCircleOutlined /> Pre-arrival screening</div>
              </div>
            </div>
            {/* Feature 2 */}
            <div style={{ background: "#0A2540", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SafetyCertificateOutlined style={{ fontSize: 24, color: "#63FCC0" }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#fff", margin: 0 }}>Enterprise Security</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>Automatic background checks and watch-list screening integrated directly into your check-in flow.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: "#63FCC0" }}><CheckCircleOutlined /> Real-time alerts</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: "#63FCC0" }}><CheckCircleOutlined /> Compliance audit trails</div>
              </div>
            </div>
            {/* Feature 3 */}
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(251,188,14,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarOutlined style={{ fontSize: 24, color: "#B28400" }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#0A2540", margin: 0 }}>Smart Scheduling</h3>
              <p style={{ fontSize: 14, color: "#43474D", lineHeight: 1.6, margin: 0 }}>Intelligent calendar integration, automated reminders, and conflict detection for seamless appointment management.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: "#006C4B" }}><CheckCircleOutlined /> SMS & Email reminders</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: "#006C4B" }}><CheckCircleOutlined /> Host auto-notification</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: "64px 16px", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2 className="vf-section-heading" style={{ fontSize: 32, fontWeight: 700, color: "#0A2540", margin: "0 0 40px", letterSpacing: "-0.01em" }}>How It Works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(0,108,75,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarOutlined style={{ fontSize: 28, color: "#006C4B" }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0A2540", margin: 0 }}>Book Online</h3>
              <p style={{ fontSize: 14, color: "#43474D", margin: 0, lineHeight: 1.5 }}>Schedule your visit in advance with your preferred date and time.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(0,108,75,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircleOutlined style={{ fontSize: 28, color: "#006C4B" }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0A2540", margin: 0 }}>Get Approved</h3>
              <p style={{ fontSize: 14, color: "#43474D", margin: 0, lineHeight: 1.5 }}>Receive confirmation via email and SMS with your access code.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(0,108,75,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SafetyCertificateOutlined style={{ fontSize: 28, color: "#006C4B" }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0A2540", margin: 0 }}>Check In</h3>
              <p style={{ fontSize: 14, color: "#43474D", margin: 0, lineHeight: 1.5 }}>Scan your QR code at the kiosk for instant, touchless check-in.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "32px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SafetyCertificateOutlined style={{ fontSize: 20, color: "#00C48C" }} />
            <span style={{ fontWeight: 600, fontSize: 16, color: "#0A2540" }}>VisitFlow</span>
          </div>
          <p style={{ fontSize: 12, color: "#74777E", margin: 0 }}>
            © {new Date().getFullYear()} VisitFlow. Enterprise Visitor, Appointment & Access Management Platform.
          </p>
          <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#43474D" }}>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Privacy</a>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Terms</a>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Security</a>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @media (max-width: 768px) {
          .vf-hero-right { display: none !important; }
          .vf-hero-grid { grid-template-columns: 1fr !important; padding: 48px 16px !important; }
          .vf-hero-heading { font-size: clamp(1.75rem, 7vw, 3rem) !important; }
          .vf-hero-cta { flex-direction: column !important; }
          .vf-hero-cta a { width: 100% !important; justify-content: center !important; padding: 14px 16px !important; }
          .vf-nav-link-desktop { display: none !important; }
          .vf-section-heading { font-size: clamp(1.5rem, 5vw, 2rem) !important; }
          .vf-trust-badges { gap: 16px !important; }
        }
        @media (max-width: 480px) {
          .vf-hero-grid { padding: 32px 12px !important; }
          .vf-nav-links { gap: 8px !important; }
        }
      `}</style>
    </div>
  );
}
