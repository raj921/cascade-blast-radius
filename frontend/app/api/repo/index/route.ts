import { NextRequest } from "next/server";
import {
  parseGitHubRepoUrl,
  buildRepoIndex,
  type RepoIndex,
} from "@/lib/github-repo-cloner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface IndexRequest {
  repoUrl: string;
  token?: string;
}

/**
 * POST /api/repo/index
 * Step 1: Index a GitHub repository
 * 
 * This builds a lightweight index of the repository without full cloning.
 * The index includes:
 * - Complete file tree
 * - List of all code files
 * - Repository metadata
 * 
 * After indexing, you can analyze PRs with full context.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as IndexRequest;

    if (!body.repoUrl) {
      return new Response(
        JSON.stringify({ error: "Repository URL is required" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }

    // Validate URL
    const repoInfo = parseGitHubRepoUrl(body.repoUrl);
    if (!repoInfo) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid GitHub repository URL. Expected: https://github.com/owner/repo",
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }

    // Build index
    console.log(`Indexing repository: ${repoInfo.owner}/${repoInfo.repo}`);
    const index = await buildRepoIndex(body.repoUrl, body.token);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Repository indexed successfully",
        index: {
          owner: index.repoInfo.owner,
          repo: index.repoInfo.repo,
          url: index.repoInfo.url,
          branch: index.branch,
          totalFiles: index.totalFiles,
          codeFiles: index.codeFiles.length,
          totalSize: index.totalSize,
          indexedAt: index.indexedAt,
        },
        // Store index ID for later use
        indexId: `${index.repoInfo.owner}/${index.repoInfo.repo}`,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Repository indexing error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("404")) {
      return new Response(
        JSON.stringify({
          error:
            "Repository not found. Check the URL or provide a token for private repos.",
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
          error:
            "Access forbidden. You may need a GitHub token for this repository.",
        }),
        {
          status: 403,
          headers: { "content-type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Failed to index repository",
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
 * GET /api/repo/index?url=...
 * Check if a repository URL is valid
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response(
      JSON.stringify({
        ok: false,
        hint: "Provide a GitHub repository URL: ?url=https://github.com/owner/repo",
      }),
      {
        headers: { "content-type": "application/json" },
      }
    );
  }

  const repoInfo = parseGitHubRepoUrl(url);

  if (!repoInfo) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Invalid GitHub repository URL",
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
      repo: repoInfo,
    }),
    {
      headers: { "content-type": "application/json" },
    }
  );
}

// Made with Bob
