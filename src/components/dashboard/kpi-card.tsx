"use client";

import React from "react";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
}

export function KPICard({ title, value, description, icon, iconBg, iconColor, trend }: KPICardProps) {
  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 10, border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "box-shadow 0.2s", cursor: "default", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 500, color: "#43474D", letterSpacing: "0.01em", margin: 0, marginBottom: 4 }}>{title}</p>
          <h3 style={{ fontSize: 24, fontWeight: 600, color: "#0A2540", margin: 0, lineHeight: 1.3 }}>{typeof value === "number" ? value.toLocaleString() : value}</h3>
        </div>
        {icon && (
          <div style={{ width: 48, height: 48, borderRadius: 10, background: iconBg || "rgba(10,37,64,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: iconColor || "#0A2540", fontSize: 22 }}>
            {icon}
          </div>
        )}
      </div>
      {(trend || description) && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
          {trend && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: trend.isPositive ? "#006C4B" : "#BA1A1A", background: trend.isPositive ? "rgba(0,108,75,0.1)" : "rgba(186,26,26,0.1)", padding: "2px 8px", borderRadius: 999 }}>
              {trend.isPositive ? <ArrowUpOutlined style={{ fontSize: 10 }} /> : <ArrowDownOutlined style={{ fontSize: 10 }} />}
              {Math.abs(trend.value)}%
            </span>
          )}
          {(description || trend?.label) && (
            <span style={{ fontSize: 12, color: "#74777E" }}>{description || trend?.label}</span>
          )}
        </div>
      )}
    </div>
  );
}
