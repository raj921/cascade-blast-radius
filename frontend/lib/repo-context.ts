import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Server-only. Reads files from the sibling demo-monorepo so the API
 * can feed real cross-service source to the LLM as context for the
 * preset demos. Judges see the model trace through actual files.
 */

const MONOREPO_ROOT = path.resolve(process.cwd(), "..", "demo-monorepo");

export async function readMonorepoFile(rel: string): Promise<string> {
  const abs = path.join(MONOREPO_ROOT, rel);
  if (!abs.startsWith(MONOREPO_ROOT)) throw new Error("Path traversal blocked");
  return fs.readFile(abs, "utf8");
}

export async function readMonorepoFiles(
  rels: string[]
): Promise<Array<{ path: string; content: string }>> {
  return Promise.all(
    rels.map(async (rel) => ({
      path: rel,
      content: await readMonorepoFile(rel).catch(
        (err: NodeJS.ErrnoException) =>
          `(could not read: ${err.code ?? "ERR"})`
      ),
    }))
  );
}

export interface Preset {
  id: string;
  title: string;
  blurb: string;
  expectedRisk: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  contextFiles: string[];
  diff: string;
}

export const PRESETS: Record<string, Preset> = {
  "demo-1": {
    id: "demo-1",
    title: "Auth signature change",
    blurb:
      "verifyToken return type flips from boolean to object — every caller silently bypasses auth.",
    expectedRisk: "CRITICAL",
    contextFiles: [
      "services/auth/index.ts",
      "services/billing/checkout.ts",
      "services/billing/invoice.ts",
    ],
    diff: `diff --git a/services/auth/index.ts b/services/auth/index.ts
--- a/services/auth/index.ts
+++ b/services/auth/index.ts
@@ -8,10 +8,10 @@ import { validate, extractUserId } from './validator';
-export function verifyToken(token: string): boolean {
+export function verifyToken(token: string): { valid: boolean; userId: string } {
   if (!validate(token)) {
-    return false;
+    return { valid: false, userId: '' };
   }
-  return true;
+  return { valid: true, userId: extractUserId(token) };
 }
`,
  },

  "demo-2": {
    id: "demo-2",
    title: "Env var silent rename",
    blurb:
      "SMTP_SERVER → MAIL_HOST in code, but .env / docker-compose still ship SMTP_SERVER. Production email dies silently.",
    expectedRisk: "CRITICAL",
    contextFiles: [
      "services/notifications/config.ts",
      "services/notifications/email.ts",
      "docker-compose.yml",
    ],
    diff: `diff --git a/services/notifications/config.ts b/services/notifications/config.ts
--- a/services/notifications/config.ts
+++ b/services/notifications/config.ts
@@ -1,5 +1,5 @@
-export const SMTP_HOST = process.env.SMTP_SERVER;
+export const SMTP_HOST = process.env.MAIL_HOST;
 export const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
`,
  },

  "demo-3": {
    id: "demo-3",
    title: "Safe internal refactor",
    blurb:
      "calculateTax keeps its signature but now rounds to 2 decimals. Only behaviour, not contract.",
    expectedRisk: "MEDIUM",
    contextFiles: [
      "services/billing/utils.ts",
      "services/billing/checkout.ts",
      "services/billing/invoice.ts",
    ],
    diff: `diff --git a/services/billing/utils.ts b/services/billing/utils.ts
--- a/services/billing/utils.ts
+++ b/services/billing/utils.ts
@@ -1,4 +1,5 @@
 export function calculateTax(amount: number): number {
-  const rate = 0.08;
-  return amount * rate;
+  const TAX_RATE = 0.08;
+  return Math.round(amount * TAX_RATE * 100) / 100;
 }
`,
  },
};

export function listPresets(): Preset[] {
  return Object.values(PRESETS);
}
