"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "antd";
import { CameraOutlined, UndoOutlined, CheckOutlined } from "@ant-design/icons";

interface PhotoCaptureProps {
  onCapture: (dataUrl: string) => void;
  existingPhoto?: string | null;
}

export function PhotoCapture({ onCapture, existingPhoto }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(existingPhoto || null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 320, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setStream(mediaStream);
      setIsStreaming(true);
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  }, []);

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setIsStreaming(false);
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw square crop from center
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 320, 320);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPhoto(dataUrl);
    onCapture(dataUrl);
    stopCamera();
  }

  function retake() {
    setPhoto(null);
    startCamera();
  }

  return (
    <div className="space-y-3">
      <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/30">
        {photo && !isStreaming ? (
          <img src={photo} alt="Captured" className="w-full h-full object-cover" />
        ) : isStreaming ? (
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        ) : (
          <div className="flex items-center justify-center h-full">
            <CameraOutlined style={{ fontSize: 32, color: "#bfbfbf" }} />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex justify-center gap-2">
        {!isStreaming && !photo && (
          <Button size="small" icon={<CameraOutlined />} onClick={startCamera}>Open Camera</Button>
        )}
        {isStreaming && (
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={capturePhoto}>Capture</Button>
        )}
        {photo && !isStreaming && (
          <Button size="small" icon={<UndoOutlined />} onClick={retake}>Retake</Button>
        )}
      </div>
    </div>
  );
}
