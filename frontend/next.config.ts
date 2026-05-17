import type { NextConfig } from "next";
import path from "node:path";
import { config } from "dotenv";

// Load environment variables from root .env file
config({ path: path.resolve(__dirname, "../.env") });

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  env: {
    BOBSHELL_API_KEY: process.env.BOBSHELL_API_KEY,
    BOB_SHELL_TIMEOUT_MS: process.env.BOB_SHELL_TIMEOUT_MS,
  },
};

export default nextConfig;
