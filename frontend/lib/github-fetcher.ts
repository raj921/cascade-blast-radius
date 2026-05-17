/**
 * GitHub API integration for fetching PR diffs and file contents.
 * Supports both public repos and private repos (with token).
 */

export interface GitHubPRInfo {
  owner: string;
  repo: string;
  prNumber: number;
  url: string;
}

export interface GitHubPRData {
  diff: string;
  files: Array<{
    path: string;
    content: string;
    status: "added" | "modified" | "removed";
  }>;
  /** Total files listed on the PR (GitHub /pulls/{n}/files); may exceed `files.length` context cap. */
  totalChangedFiles: number;
  title: string;
  description: string;
  baseBranch: string;
  headBranch: string;
}

/**
 * Parse GitHub PR URL to extract owner, repo, and PR number
 * Supports formats:
 * - https://github.com/owner/repo/pull/123
 * - https://github.com/owner/repo/pull/123/files
 * - http://www.github.com/owner/repo/pull/123
 * - github.com/owner/repo/pull/123
 * - owner/repo/pull/123
 */
export function parseGitHubPRUrl(raw: string): GitHubPRInfo | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const collapsedTrail = trimmed.replace(/(\/pull\/\d+)\/.*$/i, "$1");

  const canonical = collapsedTrail
    .replace(/#.*$/, "")
    .replace(/\?.*$/, "")
    .replace(/\/files(?:\/.*)?$/i, "")
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/^github\.com\//i, "");

  const m = canonical.match(
    /^([^/]+)\/([^/]+?)(?:\.git)?\/pull\/(\d+)\/?$/i
  );
  if (!m) return null;

  const owner = m[1];
  const repo = m[2];
  const prNumber = parseInt(m[3], 10);
  if (!owner || !repo || !Number.isFinite(prNumber) || prNumber < 1)
    return null;

  return {
    owner,
    repo,
    prNumber,
    url: `https://github.com/${owner}/${repo}/pull/${prNumber}`,
  };
}

/**
 * Fetch PR diff and file contents from GitHub API
 * Uses GitHub's REST API v3
 */
export async function fetchGitHubPR(
  prInfo: GitHubPRInfo,
  token?: string
): Promise<GitHubPRData> {
  const { owner, repo, prNumber } = prInfo;
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Fetch PR metadata
  const prResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    { headers }
  );

  if (!prResponse.ok) {
    throw new Error(
      `GitHub API error: ${prResponse.status} ${prResponse.statusText}`
    );
  }

  const prData = await prResponse.json();

  // Fetch PR diff
  const diffResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    {
      headers: {
        ...headers,
        Accept: "application/vnd.github.v3.diff",
      },
    }
  );

  if (!diffResponse.ok) {
    throw new Error(`Failed to fetch diff: ${diffResponse.statusText}`);
  }

  const diff = await diffResponse.text();

  // Fetch list of changed files
  const filesResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
    { headers }
  );

  if (!filesResponse.ok) {
    throw new Error(`Failed to fetch files: ${filesResponse.statusText}`);
  }

  const filesData = await filesResponse.json();
  const allChanged = Array.isArray(filesData) ? filesData : [];
  const CONTEXT_FILE_CAP = 10;

  // Fetch content of each changed file (cap for performance / prompt size)
  const filesToFetch = allChanged.slice(0, CONTEXT_FILE_CAP);
  const files = await Promise.all(
    filesToFetch.map(async (file: any) => {
      try {
        // Fetch file content from the PR's head branch
        const contentResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${file.filename}?ref=${prData.head.ref}`,
          { headers }
        );

        if (!contentResponse.ok) {
          return {
            path: file.filename,
            content: `// Could not fetch: ${contentResponse.statusText}`,
            status: file.status,
          };
        }

        const contentData = await contentResponse.json();

        // GitHub returns base64-encoded content
        const content = Buffer.from(contentData.content, "base64").toString(
          "utf-8"
        );

        return {
          path: file.filename,
          content,
          status: file.status,
        };
      } catch (error) {
        return {
          path: file.filename,
          content: `// Error fetching file: ${error}`,
          status: file.status,
        };
      }
    })
  );

  return {
    diff,
    files,
    totalChangedFiles: allChanged.length,
    title: prData.title,
    description: prData.body || "",
    baseBranch: prData.base.ref,
    headBranch: prData.head.ref,
  };
}

/**
 * Validate GitHub token (optional)
 */
export async function validateGitHubToken(token: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get GitHub API rate limit status
 */
export async function getGitHubRateLimit(
  token?: string
): Promise<{
  limit: number;
  remaining: number;
  reset: Date;
}> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch("https://api.github.com/rate_limit", {
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch rate limit");
  }

  const data = await response.json();
  const core = data.resources.core;

  return {
    limit: core.limit,
    remaining: core.remaining,
    reset: new Date(core.reset * 1000),
  };
}

// Made with Bob
