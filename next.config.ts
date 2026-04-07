import type { NextConfig } from "next";

const supabaseHostname = (() => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return undefined;
  }

  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/app",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/app/:path*",
        destination: "/:path*",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/a/**",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/uc",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/thumbnail",
      },
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
