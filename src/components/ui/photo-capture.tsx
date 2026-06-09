"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button, Modal, Avatar, Space, Upload, message } from "antd";
import { CameraOutlined, UploadOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";

interface PhotoCaptureProps {
  value?: string;
  onChange?: (url: string | null) => void;
  size?: number;
  shape?: "circle" | "square";
}

export function PhotoCapture({ value, onChange, size = 100, shape = "circle" }: PhotoCaptureProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: "user" },
      });
      setStream(mediaStream);
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      message.error("Unable to access camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraOpen(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, 480, 480);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    onChange?.(dataUrl);
    stopCamera();
  }, [onChange, stopCamera]);

  const handleUpload = useCallback(
    (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        message.error("File too large. Max 5MB.");
        return false;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange?.(result);
      };
      reader.readAsDataURL(file);
      return false;
    },
    [onChange]
  );

  const handleRemove = useCallback(() => {
    onChange?.(null);
  }, [onChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <Avatar
        src={value || undefined}
        icon={!value ? <UserOutlined /> : undefined}
        size={size}
        shape={shape}
        style={{ border: "2px solid #E5E7EB", background: value ? undefined : "#F1F5F9" }}
      />
      <Space size={8}>
        <Button size="small" icon={<CameraOutlined />} onClick={startCamera}>
          Camera
        </Button>
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleUpload}
        >
          <Button size="small" icon={<UploadOutlined />}>Upload</Button>
        </Upload>
        {value && (
          <Button size="small" icon={<DeleteOutlined />} danger onClick={handleRemove} />
        )}
      </Space>

      <Modal
        title="Take Photo"
        open={cameraOpen}
        onCancel={stopCamera}
        footer={[
          <Button key="cancel" onClick={stopCamera}>Cancel</Button>,
          <Button key="capture" type="primary" onClick={capturePhoto} style={{ background: "#00C48C", borderColor: "#00C48C" }}>
            Capture
          </Button>,
        ]}
        destroyOnClose
        width={520}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <video
            ref={videoRef}
            style={{ width: 480, height: 360, borderRadius: 10, background: "#000", objectFit: "cover" }}
            autoPlay
            playsInline
            muted
          />
        </div>
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </Modal>
    </div>
  );
}
