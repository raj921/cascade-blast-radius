# Cascade Setup Documentation

## Project Information

**Repository**: https://github.com/raj921/cascade-blast-radius  
**Created**: 2026-05-16  
**License**: MIT  
**Purpose**: Blast-radius analysis agent powered by IBM Bob

## Directory Structure Created

```
cascade-blast-radius/
├── bob-reports/              ✓ Created
├── cascade/
│   └── demo-outputs/         ✓ Created
├── demo-monorepo/
│   ├── services/
│   │   ├── auth/             ✓ Created
│   │   ├── billing/          ✓ Created
│   │   └── notifications/    ✓ Created
│   ├── shared/               ✓ Created
│   └── tests/
│       └── regression/       ✓ Created
└── docs/                     ✓ Created
```

## Custom Mode: cascade-architect

### Configuration

**Mode Name**: cascade-architect  
**Mode Slug**: cascade-architect  
**Description**: Blast-radius analysis agent for code changes

### System Prompt

```
You are Cascade, a blast-radius analysis agent.

When given a git diff and repository context, you:

1. Identify every changed symbol — functions, types, 
   exports, env vars, config keys
2. Traverse the full import/call graph across ALL files 
   including cross-service boundaries
3. Classify every impact:
   CRITICAL = contract change with no type safety net
   HIGH = behavioral change on a hot path
   MEDIUM = covered by tests but logic-relevant  
   LOW = style/comment only
4. Find INDIRECT coupling — destructured returns, shared 
   env vars, JSON payloads, message queues
5. Output JSON only. No prose. No markdown fences.

Output schema:
{
  "changed_symbols": [
    { "file": "", "symbol": "", "kind": "", "old_sig": "", "new_sig": "" }
  ],
  "impacts": [
    { "file": "", "line": 0, "symbol": "", "risk": "CRITICAL", 
      "reason": "", "indirect": false }
  ],
  "missing_tests": [
    { "file": "", "scenario": "" }
  ],
  "suggested_regression_tests": [
    { "path": "", "code": "" }
  ],
  "summary": {
    "overall_risk": "",
    "files_affected": 0,
    "cross_service": false
  }
}
```

### How to Create the Custom Mode

1. Open IBM Bob in VS Code
2. Go to Settings → Custom Modes
3. Click "New Mode"
4. Enter the following:
   - **Name**: cascade-architect
   - **System Prompt**: Copy the prompt above
5. Save the mode

### Verification

To verify the custom mode is working:
1. Switch to cascade-architect mode
2. Test with a simple prompt: "Analyze this diff: function test() { return true; }"
3. Confirm it responds with JSON output

## IBM Bob Verification

IBM Bob is installed and operational in this VS Code workspace.

**Verified Capabilities**:
- ✓ File operations (read, write, list)
- ✓ Command execution
- ✓ Multi-file analysis
- ✓ Mode switching
- ✓ Tool access

## Next Steps

1. Create demo monorepo structure with sample code
2. Execute Phase 1 prompts (Architecture Discovery)
3. Execute Phase 2 prompts (Three Demo Cases)
4. Execute Phase 3 prompts (Build Output)
5. Execute Phase 4 prompts (Documentation)

## Setup Complete

All prerequisites are in place. Ready to proceed with prompt execution.

---

**Setup completed**: 2026-05-16  
**Time taken**: ~15 minutes  
**Status**: ✓ Ready for Phase 1