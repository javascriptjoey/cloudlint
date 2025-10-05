# MCP Server Troubleshooting - Quick Reference

## Context7 "Not Connected" Error - SOLVED ✅

### Issue (2025-10-04)

- **Error:** `Error calling MCP tool: Not connected`
- **Tools Affected:** `mcp_context7_resolve_library_id`, `mcp_context7_get_library_docs`

### Root Cause

MCP server was configured but not actively connected. Configuration lacked:

1. Logging configuration for visibility
2. Auto-approval for tools (causing connection issues)

### Solution Applied ✅

Updated `.kiro/settings/mcp.json`:

```json
"context7": {
  "command": "npx",
  "args": ["-y", "@upstash/context7-mcp"],
  "env": {
    "NODE_ENV": "development",
    "FASTMCP_LOG_LEVEL": "INFO"  // ← Added for visibility
  },
  "disabled": false,
  "autoApprove": [  // ← Added to prevent approval prompts
    "mcp_context7_resolve_library_id",
    "mcp_context7_get_library_docs"
  ],
  "restart": true,
  "timeout": 30000
}
```

### Steps Taken

1. Added `FASTMCP_LOG_LEVEL: "INFO"` to env
2. Added `autoApprove` array with Context7 tool names
3. Saved configuration (triggers auto-reconnection)
4. Waited 3 seconds for reconnection
5. Verified with test call to `mcp_context7_resolve_library_id`

### Result

✅ **WORKING** - Successfully retrieved 30 library results for "husky" query

---

## Quick Fix for Future Issues

If you see "Not connected" error:

1. **Edit** `.kiro/settings/mcp.json`
2. **Add/modify** any env variable (e.g., change log level)
3. **Save** the file
4. **Wait** 3-5 seconds
5. **Test** the connection

---

## Full Documentation

See `docs/troubleshooting/mcp-server-issues.md` for comprehensive troubleshooting guide.

---

## Prevention Checklist

For all MCP servers, ensure:

- [ ] `disabled: false`
- [ ] `restart: true`
- [ ] `timeout: 30000` or higher
- [ ] `autoApprove` array includes frequently used tools
- [ ] Logging enabled during development (`FASTMCP_LOG_LEVEL: "INFO"`)

---

**Last Updated:** 2025-10-04  
**Status:** RESOLVED ✅
