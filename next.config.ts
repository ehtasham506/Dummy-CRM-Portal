import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a parent folder also has a lockfile).
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
