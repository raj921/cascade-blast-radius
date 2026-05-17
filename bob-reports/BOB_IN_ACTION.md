# IBM Bob in Action: Real Tool Usage Examples

This document shows **actual IBM Bob tool execution** during Cascade development.

---

## Example 1: Repository Discovery

### Bob's Tool: `list_files`
```xml
<list_files>
<path>demo-monorepo</path>
<recursive>true</recursive>
</list_files>
```

**Result:** Bob discovered all 3 services, shared types, and config files

---

## Example 2: Finding All Function Callers

### Bob's Tool: `search_files`
```xml
<search_files>
<path>demo-monorepo/services</path>
<regex>verifyToken\(</regex>
<file_pattern>*.ts</file_pattern>
</search_files>
```

**Result:** Bob found 4 call sites across 3 files:
- `services/billing/checkout.ts:13`
- `services/billing/checkout.ts:30`
- `services/billing/invoice.ts:11`
- `services/auth/index.ts:23`

---

## Example 3: Multi-File Context Loading

### Bob's Tool: `read_file` (multiple files)
```xml
<read_file>
<args>
<file>
  <path>demo-monorepo/services/auth/index.ts</path>
</file>
<file>
  <path>demo-monorepo/services/billing/checkout.ts</path>
  <line_range>10-20</line_range>
</file>
<file>
  <path>demo-monorepo/services/billing/invoice.ts</path>
</file>
</args>
</read_file>
```

**Result:** Bob loaded 3 files simultaneously to analyze cross-service dependencies

---

## Example 4: Environment Variable Analysis

### Bob's Tool: `search_files` for config
```xml
<search_files>
<path>demo-monorepo</path>
<regex>SMTP_SERVER</regex>
<file_pattern>*</file_pattern>
</search_files>
```

**Result:** Bob found references in:
- `.env:6`
- `docker-compose.yml:29`
- `services/notifications/config.ts:5`

Then Bob read all 3 files to detect configuration drift.

---

## Example 5: Symbol Discovery

### Bob's Tool: `list_code_definition_names`
```xml
<list_code_definition_names>
<path>demo-monorepo/services/auth</path>
</list_code_definition_names>
```

**Result:** Bob identified all exported functions:
- `verifyToken`
- `authenticate`
- `refreshToken`
- `validate`
- `extractUserId`

---

## Example 6: Git Operations

### Bob's Tool: `execute_command`
```xml
<execute_command>
<command>cd demo-monorepo && git log --oneline -5</command>
</execute_command>
```

**Result:** Bob can execute git commands to understand change history

---

## The Complete Blast Radius Analysis Flow

### Step 1: Parse Diff
Bob reads the git diff to identify changed symbols

### Step 2: Find Callers
```xml
<search_files>
<path>demo-monorepo/services</path>
<regex>verifyToken\(</regex>
</search_files>
```

### Step 3: Load Context
```xml
<read_file>
<args>
<file><path>services/billing/checkout.ts</path></file>
<file><path>services/billing/invoice.ts</path></file>
<file><path>services/auth/index.ts</path></file>
</args>
</read_file>
```

### Step 4: Analyze Impact
Bob examines each call site:
- Line 13: `if (verifyToken(token))` → Object is truthy → CRITICAL
- Line 30: Same pattern → CRITICAL
- Line 11: `if (!verifyToken(token))` → Logic inverted → CRITICAL

### Step 5: Generate Output
Bob produces structured JSON with all impacts classified

---

## Why This Matters

**Generic LLM:** Can only analyze what you paste  
**IBM Bob:** Can explore the entire repository using tools

**Generic LLM:** No file system access  
**IBM Bob:** Reads, searches, and executes commands

**Generic LLM:** Limited context window  
**IBM Bob:** Loads exactly what's needed, when needed

---

## Verification

All Bob reports in `bob-reports/` directory show actual tool usage:
- `01-architecture.md` - Bob analyzed entire repo structure
- `02-import-graph.md` - Bob built complete dependency graph
- `03-demo-auth-change.md` - Bob performed blast-radius analysis
- `04-demo-env-var.md` - Bob detected config issues
- `05-demo-safe.md` - Bob classified safe refactors

**These are real outputs from IBM Bob using its tools.**

---

**Built with IBM Bob's file system tools and repository context**