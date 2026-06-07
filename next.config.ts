import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev origins for browser preview
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Reduce compilation overhead
  typescript: {
    ignoreBuildErrors: false,
  },
  // Optimize server external packages (don't bundle heavy server libs)
  serverExternalPackages: ["bcryptjs", "nodemailer", "pusher", "googleapis", "ics", "qrcode"],
  // Reduce page data fetching timeout
  experimental: {
    // Speed up dev by reducing unnecessary recompiles
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-popover",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-tooltip",
      "date-fns",
    ],
  },
};

export default nextConfig;
