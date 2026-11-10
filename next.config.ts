import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  async headers() {
    const security: { key: string; value: string }[] = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    if (process.env.NODE_ENV === "production") security.push(
      { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" },
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
    );
    return [{ source: "/:path*", headers: security }];
  },
};
export default nextConfig;
