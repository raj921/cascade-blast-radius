/**
 * Copy-paste example for `/analyze` when you are not using a preset.
 * Matches the demo-monorepo "signature change" story: callers that still
 * treat the return value as a boolean will silently pass.
 *
 * For strongest results (repo files sent to Bob), use the
 * **demo-1** preset card instead — same diff + real cross-service context.
 */
export const EXAMPLE_UNIFIED_DIFF = `diff --git a/services/auth/index.ts b/services/auth/index.ts
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
`;
