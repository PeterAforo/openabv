export default function OfflinePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <span style={{ fontSize: 36, color: "#00C48C", fontWeight: 700 }}>VF</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0A2540", margin: "0 0 12px" }}>You&apos;re Offline</h1>
        <p style={{ fontSize: 16, color: "#43474D", lineHeight: 1.6, margin: "0 0 32px" }}>
          It looks like you&apos;ve lost your internet connection. Please check your network settings and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "12px 32px",
            background: "#0A2540",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
        <p style={{ fontSize: 12, color: "#74777E", marginTop: 24 }}>
          Some previously visited pages may still be available.
        </p>
      </div>
    </div>
  );
}
