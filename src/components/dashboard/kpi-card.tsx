"use client";

import React from "react";
import { Card, Statistic } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function KPICard({ title, value, description, icon, trend }: KPICardProps) {
  return (
    <Card size="small" hoverable>
      <Statistic
        title={title}
        value={value}
        prefix={icon}
        suffix={
          trend ? (
            <span style={{ fontSize: 12, color: trend.isPositive ? "#52c41a" : "#ff4d4f" }}>
              {trend.isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {Math.abs(trend.value)}%
            </span>
          ) : undefined
        }
      />
      {description && <p style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>{description}</p>}
    </Card>
  );
}
