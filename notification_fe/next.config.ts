import type { NextConfig } from "next";
import path from "node:path";

const workspaceRoot = path.join(process.cwd(), "..").replace(/\\/g, "/");
const loggingMiddlewareEntry = path
  .join(process.cwd(), "../logging_middleware_/index.js")
  .replace(/\\/g, "/");

const nextConfig: NextConfig = {
  transpilePackages: ["logging-middleware"],
  turbopack: {
    root: workspaceRoot,
    resolveAlias: {
      "logging-middleware": loggingMiddlewareEntry,
    },
  },
};

export default nextConfig;
