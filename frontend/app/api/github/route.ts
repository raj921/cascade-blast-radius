import { NextRequest } from "next/server";
import {
  parseGitHubPRUrl,
  fetchGitHubPR,
  getGitHubRateLimit,
  type GitHubPRInfo,
} from "@/lib/github-fetcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GitHubFetchRequest {
  url: string;
  token?: string;
}

/**
 * POST /api/github
 * Fetch PR data from GitHub URL
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GitHubFetchRequest;

    if (!body.url) {
      return new Response(
        JSON.stringify({ error: "GitHub URL is required" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }

    // Parse GitHub URL
    const prInfo = parseGitHubPRUrl(body.url);
    if (!prInfo) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid GitHub PR URL. Use: https://github.com/OWNER/REPO/pull/NUMBER (any public org or user; optional token for private repos).",
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }

    // Check rate limit before fetching
    try {
      const rateLimit = await getGitHubRateLimit(body.token);
      if (rateLimit.remaining === 0) {
        return new Response(
          JSON.stringify({
            error: "GitHub API rate limit exceeded",
            resetAt: rateLimit.reset.toISOString(),
          }),
          {
            status: 429,
            headers: { "content-type": "application/json" },
          }
        );
      }
    } catch (rateLimitError) {
      // Continue even if rate limit check fails
      console.warn("Could not check rate limit:", rateLimitError);
    }

    // Fetch PR data
    const prData = await fetchGitHubPR(prInfo, body.token);

    return new Response(
      JSON.stringify({
        success: true,
        pr: {
          url: prInfo.url,
          owner: prInfo.owner,
          repo: prInfo.repo,
          number: prInfo.prNumber,
          title: prData.title,
          description: prData.description,
          baseBranch: prData.baseBranch,
          headBranch: prData.headBranch,
        },
        diff: prData.diff,
        files: prData.files.map((f) => ({
          path: f.path,
          content: f.content,
          status: f.status,
        })),
        /** Files included in `files` (context cap for Bob prompt). */
        filesCount: prData.files.length,
        /** All files changed on the PR per GitHub (may be larger than `filesCount`). */
        totalChangedFiles: prData.totalChangedFiles,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (error) {
    console.error("GitHub fetch error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Check for specific GitHub API errors
    if (errorMessage.includes("404")) {
      return new Response(
        JSON.stringify({
          error: "PR not found. Check the URL or provide a GitHub token for private repos.",
        }),
        {
          status: 404,
          headers: { "content-type": "application/json" },
        }
      );
    }

    if (errorMessage.includes("403")) {
      return new Response(
        JSON.stringify({
          error: "Access forbidden. You may need a GitHub token for this repo.",
        }),
        {
          status: 403,
          headers: { "content-type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Failed to fetch from GitHub",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
}

/**
 * GET /api/github?url=...
 * Quick check if URL is valid
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response(
      JSON.stringify({
        ok: false,
        hint: "Provide a GitHub PR URL: ?url=https://github.com/owner/repo/pull/123",
      }),
      {
        headers: { "content-type": "application/json" },
      }
    );
  }

  const prInfo = parseGitHubPRUrl(url);

  if (!prInfo) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Invalid GitHub PR URL",
      }),
      {
        status: 400,
        headers: { "content-type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      pr: prInfo,
    }),
    {
      headers: { "content-type": "application/json" },
    }
  );
}

// Made with Bob
