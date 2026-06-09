"use client";

import "antd/dist/reset.css";
import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { ConfigProvider, App as AntApp, theme as antTheme } from "antd";

const lightTheme = {
  token: {
    colorPrimary: "#0A2540",
    colorSuccess: "#00C48C",
    colorWarning: "#F5B700",
    colorError: "#EF4444",
    colorInfo: "#3B82F6",
    borderRadius: 10,
    fontFamily: "Inter, system-ui, sans-serif",
  },
};

const darkTheme = {
  algorithm: antTheme.darkAlgorithm,
  token: {
    colorPrimary: "#00C48C",
    colorSuccess: "#00C48C",
    colorWarning: "#F5B700",
    colorError: "#EF4444",
    colorInfo: "#3B82F6",
    borderRadius: 10,
    fontFamily: "Inter, system-ui, sans-serif",
    colorBgBase: "#0a0e14",
    colorBgContainer: "#111820",
    colorBgElevated: "#161e28",
    colorBgLayout: "#0a0e14",
    colorBorder: "#1e2a38",
    colorBorderSecondary: "#1a2432",
    colorText: "#e8ecf0",
    colorTextSecondary: "#8b95a3",
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    setIsDark(document.documentElement.classList.contains("dark"));
    return () => observer.disconnect();
  }, []);

  return (
    <SessionProvider>
      <ConfigProvider theme={isDark ? darkTheme : lightTheme}>
        <AntApp>
          {children}
        </AntApp>
      </ConfigProvider>
    </SessionProvider>
  );
}
