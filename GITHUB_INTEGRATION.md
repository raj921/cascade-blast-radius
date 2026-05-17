# GitHub Integration Guide

Cascade can automatically fetch and analyze Pull Requests directly from GitHub URLs!

---

## 🚀 Quick Start

### **Option 1: Paste GitHub PR URL**

```
1. Go to any GitHub PR
2. Copy the URL: https://github.com/owner/repo/pull/123
3. Paste into Cascade
4. Click "Fetch from GitHub"
5. Cascade automatically analyzes the PR!
```

### **Option 2: Use the API**

```bash
curl -X POST http://localhost:3000/api/github \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/facebook/react/pull/12345"
  }'
```

---

## 📋 Supported URL Formats

Cascade accepts these GitHub PR URL formats:

```
✅ https://github.com/owner/repo/pull/123
✅ https://github.com/owner/repo/pull/123/files
✅ github.com/owner/repo/pull/123
✅ owner/repo/pull/123
```

---

## 🔑 GitHub Token (Optional)

### **For Public Repositories:**
- ✅ No token needed
- ✅ Works out of the box
- ⚠️ Subject to GitHub API rate limits (60 requests/hour)

### **For Private Repositories:**
- 🔒 Requires GitHub Personal Access Token
- ✅ Higher rate limits (5000 requests/hour)
- ✅ Access to private repos

### **How to Create a GitHub Token:**

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` (for private repos)
   - ✅ `public_repo` (for public repos only)
4. Generate and copy the token
5. Add to Cascade:
   - Frontend: Paste in the token field
   - API: Include in request body

---

## 🎯 How It Works

### **Step 1: Parse URL**
```typescript
// Cascade extracts owner, repo, and PR number
parseGitHubPRUrl("https://github.com/facebook/react/pull/12345")
// Returns: { owner: "facebook", repo: "react", prNumber: 12345 }
```

### **Step 2: Fetch PR Data**
```typescript
// Cascade calls GitHub API to get:
// - PR diff
// - Changed files list
// - File contents
// - PR metadata (title, description, branches)
```

### **Step 3: Analyze**
```typescript
// Cascade runs blast-radius analysis on the fetched code
// Same analysis as manual diff paste, but automated!
```

---

## 📊 What Cascade Fetches

### **From GitHub API:**

1. **PR Diff** - Complete unified diff
2. **Changed Files** - List of all modified files
3. **File Contents** - Full content of changed files (up to 10 files)
4. **PR Metadata**:
   - Title
   - Description
   - Base branch
   - Head branch

### **Example Response:**

```json
{
  "success": true,
  "pr": {
    "url": "https://github.com/owner/repo/pull/123",
    "owner": "owner",
    "repo": "repo",
    "number": 123,
    "title": "Fix authentication bug",
    "baseBranch": "main",
    "headBranch": "fix/auth"
  },
  "diff": "diff --git a/src/auth.ts...",
  "files": [
    {
      "path": "src/auth.ts",
      "content": "export function verifyToken...",
      "status": "modified"
    }
  ],
  "filesCount": 3
}
```

---

## 🔧 API Usage

### **Endpoint: POST /api/github**

**Request:**
```json
{
  "url": "https://github.com/owner/repo/pull/123",
  "token": "ghp_xxxxxxxxxxxx" // Optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "pr": { /* PR metadata */ },
  "diff": "/* unified diff */",
  "files": [ /* file contents */ ],
  "filesCount": 5
}
```

**Response (Error):**
```json
{
  "error": "PR not found",
  "details": "404 Not Found"
}
```

---

## 🚦 Rate Limits

### **Without Token (Public Access):**
- **Limit**: 60 requests per hour
- **Per**: IP address
- **Resets**: Every hour

### **With Token (Authenticated):**
- **Limit**: 5,000 requests per hour
- **Per**: User account
- **Resets**: Every hour

### **Check Rate Limit:**
```bash
curl https://api.github.com/rate_limit
```

---

## 💡 Use Cases

### **1. Automated PR Review**
```bash
# Fetch and analyze any PR
curl -X POST http://localhost:3000/api/github \
  -d '{"url": "https://github.com/myorg/myrepo/pull/456"}' | \
  curl -X POST http://localhost:3000/api/analyze -d @-
```

### **2. CI/CD Integration**
```yaml
# GitHub Actions workflow
- name: Analyze PR with Cascade
  run: |
    PR_URL="https://github.com/${{ github.repository }}/pull/${{ github.event.pull_request.number }}"
    curl -X POST https://cascade.company.com/api/github \
      -d "{\"url\": \"$PR_URL\", \"token\": \"${{ secrets.GITHUB_TOKEN }}\"}"
```

### **3. Batch Analysis**
```bash
# Analyze multiple PRs
for pr in 123 124 125; do
  curl -X POST http://localhost:3000/api/github \
    -d "{\"url\": \"https://github.com/owner/repo/pull/$pr\"}"
done
```

---

## 🛡️ Security & Privacy

### **What Cascade Does:**
- ✅ Fetches PR data via GitHub's public API
- ✅ Analyzes code in-memory (not stored)
- ✅ Respects GitHub's rate limits
- ✅ Supports private repos with token

### **What Cascade Does NOT Do:**
- ❌ Store your GitHub token
- ❌ Save fetched code to disk
- ❌ Make any changes to your repo
- ❌ Access anything beyond the PR

### **Token Security:**
- Tokens are used only for API requests
- Not logged or persisted
- Transmitted over HTTPS only
- You control token permissions

---

## 🐛 Troubleshooting

### **Error: "PR not found"**
- ✅ Check the URL is correct
- ✅ Verify the PR exists
- ✅ For private repos, provide a token

### **Error: "Rate limit exceeded"**
- ✅ Wait for rate limit to reset
- ✅ Use a GitHub token for higher limits
- ✅ Check reset time in error response

### **Error: "Access forbidden"**
- ✅ Repo may be private - provide token
- ✅ Check token has correct permissions
- ✅ Verify token is not expired

### **Error: "Could not fetch file"**
- ✅ File may be too large (>1MB)
- ✅ File may be binary
- ✅ Check file exists in PR branch

---

## 📚 Examples

### **Example 1: Analyze React PR**
```bash
curl -X POST http://localhost:3000/api/github \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/facebook/react/pull/28000"
  }'
```

### **Example 2: Private Repo with Token**
```bash
curl -X POST http://localhost:3000/api/github \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/mycompany/private-repo/pull/42",
    "token": "ghp_your_token_here"
  }'
```

### **Example 3: Check URL Validity**
```bash
curl "http://localhost:3000/api/github?url=https://github.com/owner/repo/pull/123"
```

---

## 🎉 Benefits

### **For Developers:**
- ✅ No manual copy-paste of diffs
- ✅ Automatic file fetching
- ✅ One-click analysis
- ✅ Works on any public PR

### **For Teams:**
- ✅ Integrate into PR review workflow
- ✅ Automate blast-radius checks
- ✅ Catch breaking changes early
- ✅ Reduce production incidents

### **For CI/CD:**
- ✅ Automated PR analysis
- ✅ Block risky merges
- ✅ Generate reports automatically
- ✅ Integrate with existing pipelines

---

## 🚀 Next Steps

1. **Try it now**: Paste a GitHub PR URL into Cascade
2. **Get a token**: For private repos or higher rate limits
3. **Integrate**: Add to your CI/CD pipeline
4. **Automate**: Set up automatic PR analysis

---

**Built with ❤️ for the GitHub community**