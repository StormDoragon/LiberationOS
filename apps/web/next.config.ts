import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@liberation-os/agent-packs",
    "@liberation-os/ai-core",
    "@liberation-os/analytics",
    "@liberation-os/db",
    "@liberation-os/integrations",
    "@liberation-os/prompts",
    "@liberation-os/types",
    "@liberation-os/ui",
    "@liberation-os/utils",
    "@liberation-os/workflow-engine",
  ],
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
