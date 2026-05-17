import AnalyzeClient from "./analyze-client";
import { listPresets, PRESETS } from "@/lib/repo-context";
import {
  bobBinaryAvailable,
  CASCADE_BOB_ENGINE,
  hasBobShellApiKey,
  isBobShellReady,
} from "@/lib/bob-shell";

export const dynamic = "force-dynamic";

export default async function AnalyzePage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; pr?: string }>;
}) {
  const presets = listPresets();
  const { preset, pr } = await searchParams;
  const initialPreset = preset && PRESETS[preset] ? preset : null;
  const initialPrUrl =
    typeof pr === "string" && pr.trim()
      ? decodeURIComponent(pr.trim())
      : null;

  const apiKey = hasBobShellApiKey();
  const bin = bobBinaryAvailable();
  const bobReady = isBobShellReady();
  let bobBlockedMessage: string | null = null;
  if (!bin) {
    bobBlockedMessage =
      "The `bob` CLI is not on PATH. Install IBM Bob Shell so `bob --help` works in the same environment as this Next.js server.";
  } else if (!apiKey) {
    bobBlockedMessage =
      "BOBSHELL_API_KEY is not set. Copy `.env.example` to `.env.local` and add an Inference-scoped key from the Bob web portal.";
  }

  return (
    <AnalyzeClient
      presets={presets}
      bobReady={bobReady}
      bobBlockedMessage={bobBlockedMessage}
      engineLabel={CASCADE_BOB_ENGINE}
      initialPresetId={initialPreset}
      initialPrUrl={initialPrUrl}
    />
  );
}
