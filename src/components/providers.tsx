"use client";

import "antd/dist/reset.css";
import { SessionProvider } from "next-auth/react";
import { ConfigProvider, App as AntApp } from "antd";

const theme = {
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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConfigProvider theme={theme}>
        <AntApp>
          {children}
        </AntApp>
      </ConfigProvider>
    </SessionProvider>
  );
}
