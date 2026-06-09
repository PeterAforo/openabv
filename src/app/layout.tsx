import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "VisitFlow - Smart Appointments. Secure Access.",
  description: "Enterprise visitor management, appointment scheduling, access control, visitor approvals, QR check-in, calendar integration, and real-time visitor tracking.",
  keywords: ["visitor management", "appointment booking", "visitor check-in", "access control", "security management", "visitor tracking", "appointment scheduling", "enterprise SaaS"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VisitFlow",
  },
  icons: {
    apple: "/icons/icon-192.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0A2540" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0e14" media="(prefers-color-scheme: dark)" />
      </head>
      <body className="min-h-full font-sans antialiased">
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
