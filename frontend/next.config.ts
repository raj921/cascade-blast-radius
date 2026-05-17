import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

// Local dev: optional repo-root .env next to `frontend/`. On Vercel use Project Env Vars only.
const parentEnv = path.resolve(__dirname, "../.env");
if (process.env.VERCEL !== "1" && fs.existsSync(parentEnv)) {
  config({ path: parentEnv });
}

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Do not use `next.config.env` for BOBSHELL_API_KEY — that inlines values into the client bundle.
};

export default nextConfig;
