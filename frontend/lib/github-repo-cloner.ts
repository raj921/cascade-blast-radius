/**
 * GitHub Repository Cloning and Indexing
 * 
 * Two-step workflow:
 * 1. Clone/index a GitHub repository
 * 2. Analyze PRs with full repository context
 */

export interface RepoInfo {
  owner: string;
  repo: string;
  url: string;
  defaultBranch: string;
}

export interface ClonedRepo {
  id: string;
  owner: string;
  repo: string;
  url: string;
  clonedAt: Date;
  path: string;
  branch: string;
  fileCount: number;
  size: number;
}

/**
 * Parse GitHub repository URL
 * Supports:
 * - https://github.com/owner/repo
 * - github.com/owner/repo
 * - owner/repo
 */
export function parseGitHubRepoUrl(url: string): RepoInfo | null {
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/\s]+)/,
    /^([^\/]+)\/([^\/\s]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const [, owner, repo] = match;
      // Remove .git suffix if present
      const cleanRepo = repo.replace(/\.git$/, '');
      return {
        owner,
        repo: cleanRepo,
        url: `https://github.com/${owner}/${cleanRepo}`,
        defaultBranch: 'main', // Will be updated after fetch
      };
    }
  }

  return null;
}

/**
 * Fetch repository metadata from GitHub API
 */
export async function fetchRepoMetadata(
  repoInfo: RepoInfo,
  token?: string
): Promise<{
  defaultBranch: string;
  size: number;
  language: string;
  description: string;
}> {
  const { owner, repo } = repoInfo;
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch repo: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    defaultBranch: data.default_branch,
    size: data.size,
    language: data.language,
    description: data.description || '',
  };
}

/**
 * Get repository file tree from GitHub API
 * This gives us the complete file structure without cloning
 */
export async function fetchRepoTree(
  repoInfo: RepoInfo,
  branch: string,
  token?: string
): Promise<Array<{ path: string; type: 'blob' | 'tree'; size: number }>> {
  const { owner, repo } = repoInfo;
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Get the tree recursively
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tree: ${response.statusText}`);
  }

  const data = await response.json();

  return data.tree.map((item: any) => ({
    path: item.path,
    type: item.type,
    size: item.size || 0,
  }));
}

/**
 * Fetch multiple files from repository
 * Used to build context for analysis
 */
export async function fetchRepoFiles(
  repoInfo: RepoInfo,
  filePaths: string[],
  branch: string,
  token?: string
): Promise<Array<{ path: string; content: string }>> {
  const { owner, repo } = repoInfo;
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Fetch files in parallel (limit to 20 at a time to avoid rate limits)
  const batchSize = 20;
  const results: Array<{ path: string; content: string }> = [];

  for (let i = 0; i < filePaths.length; i += batchSize) {
    const batch = filePaths.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (filePath) => {
        try {
          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
            { headers }
          );

          if (!response.ok) {
            return {
              path: filePath,
              content: `// Could not fetch: ${response.statusText}`,
            };
          }

          const data = await response.json();

          // GitHub returns base64-encoded content
          const content = Buffer.from(data.content, 'base64').toString('utf-8');

          return { path: filePath, content };
        } catch (error) {
          return {
            path: filePath,
            content: `// Error: ${error}`,
          };
        }
      })
    );

    results.push(...batchResults);
  }

  return results;
}

/**
 * Search for files that might import/use a changed symbol
 * This is a heuristic approach without full cloning
 */
export async function findPotentialCallers(
  repoInfo: RepoInfo,
  symbolName: string,
  fileTree: Array<{ path: string; type: string }>,
  branch: string,
  token?: string
): Promise<string[]> {
  // Filter to code files only
  const codeFiles = fileTree.filter(
    (f) =>
      f.type === 'blob' &&
      (f.path.endsWith('.ts') ||
        f.path.endsWith('.tsx') ||
        f.path.endsWith('.js') ||
        f.path.endsWith('.jsx'))
  );

  // Use GitHub code search API (if available)
  const { owner, repo } = repoInfo;
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    // Search for the symbol in the repository
    const searchQuery = `${symbolName} repo:${owner}/${repo}`;
    const response = await fetch(
      `https://api.github.com/search/code?q=${encodeURIComponent(searchQuery)}`,
      { headers }
    );

    if (response.ok) {
      const data = await response.json();
      return data.items.map((item: any) => item.path);
    }
  } catch (error) {
    console.warn('Code search failed, using heuristic approach');
  }

  // Fallback: Return files that are likely to import the changed file
  // This is a heuristic and not perfect
  return codeFiles.slice(0, 50).map((f) => f.path);
}

/**
 * Build repository index for fast analysis
 * This creates a lightweight index without full cloning
 */
export interface RepoIndex {
  repoInfo: RepoInfo;
  branch: string;
  fileTree: Array<{ path: string; type: string; size: number }>;
  codeFiles: string[];
  totalFiles: number;
  totalSize: number;
  indexedAt: Date;
}

export async function buildRepoIndex(
  repoUrl: string,
  token?: string
): Promise<RepoIndex> {
  // Parse URL
  const repoInfo = parseGitHubRepoUrl(repoUrl);
  if (!repoInfo) {
    throw new Error('Invalid GitHub repository URL');
  }

  // Fetch metadata
  const metadata = await fetchRepoMetadata(repoInfo, token);
  repoInfo.defaultBranch = metadata.defaultBranch;

  // Fetch file tree
  const fileTree = await fetchRepoTree(repoInfo, metadata.defaultBranch, token);

  // Filter code files
  const codeFiles = fileTree
    .filter(
      (f) =>
        f.type === 'blob' &&
        (f.path.endsWith('.ts') ||
          f.path.endsWith('.tsx') ||
          f.path.endsWith('.js') ||
          f.path.endsWith('.jsx') ||
          f.path.endsWith('.py') ||
          f.path.endsWith('.java') ||
          f.path.endsWith('.go'))
    )
    .map((f) => f.path);

  const totalSize = fileTree.reduce((sum, f) => sum + f.size, 0);

  return {
    repoInfo,
    branch: metadata.defaultBranch,
    fileTree,
    codeFiles,
    totalFiles: fileTree.length,
    totalSize,
    indexedAt: new Date(),
  };
}

// Made with Bob
