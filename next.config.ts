import type { NextConfig } from "next";

const r2PublicUrl = process.env.R2_PUBLIC_URL
  ? new URL(process.env.R2_PUBLIC_URL)
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imagedelivery.net",
      },
      ...(r2PublicUrl
        ? [
            {
              protocol: "https" as const,
              hostname: r2PublicUrl.hostname,
              pathname: `${r2PublicUrl.pathname.replace(/\/+$/, "")}/**`,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
