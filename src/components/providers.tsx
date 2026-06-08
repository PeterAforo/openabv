"use client";

import { SessionProvider } from "next-auth/react";
import { ConfigProvider, App as AntApp } from "antd";

const theme = {
  token: {
    colorPrimary: "#1677ff",
    borderRadius: 8,
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
