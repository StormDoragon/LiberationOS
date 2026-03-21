import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true
  },
  transpilePackages: [
    "@liberation-os/agent-packs",
    "@liberation-os/ai-core",
    "@liberation-os/db",
    "@liberation-os/types",
    "@liberation-os/workflow-engine"
  ]
};

export default nextConfig;
