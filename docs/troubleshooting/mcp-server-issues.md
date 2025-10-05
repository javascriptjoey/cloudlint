# MCP Server Troubleshooting Guide

This document provides solutions for common MCP (Model Context Protocol) server issues encountered in the Cloudlint project.

## Table of Contents

- [Context7 MCP Server Not Connected](#context7-mcp-server-not-connected)
- [General MCP Server Issues](#general-mcp-server-issues)
- [Configuration Best Practices](#configuration-best-practices)

---

## Context7 MCP Server Not Connected

### Symptoms

- Error message: `Error calling MCP tool: Not connected`
- Unable to use `mcp_context7_resolve_library_id` or `mcp_context7_get_library_docs`
- MCP tools return connection errors

### Root Cause

The MCP server is configured in `.kiro/settings/mcp.json` but not actively connected. MCP servers require:

1. Proper configuration
2. Active connection/startup by Kiro
3. Periodic reconnection if connection drops

### Solution

#### Step 1: Verify Configuration

Check `.kiro/settings/mcp.json` for the Context7 server configuration:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "NODE_ENV": "development",
        "FASTMCP_LOG_LEVEL": "INFO"
      },
      "disabled": false,
      "autoApprove": [
        "mcp_context7_resolve_library_id",
        "mcp_context7_get_library_docs"
      ],
      "restart": true,
      "timeout": 30000
    }
  }
}
```

#### Step 2: Update Configuration to Trigger Reconnection

If the server is configured but not connected:

1. **Add or modify environment variables** (e.g., add `FASTMCP_LOG_LEVEL`)
2. **Add autoApprove array** with tool names to avoid approval prompts
3. **Save the file** - this triggers automatic reconnection

#### Step 3: Wait for Reconnection

After saving the configuration:

- Wait 3-5 seconds for the server to reconnect
- Kiro automatically reconnects when configuration changes

#### Step 4: Verify Connection

Test the connection:

```javascript
// Try resolving a library
mcp_context7_resolve_library_id({ libraryName: "husky" });
```

If successful, you should receive library results.

### Prevention

To avoid this issue:

1. **Always include autoApprove** for frequently used tools
2. **Set appropriate timeout values** (30000ms recommended)
3. **Enable logging** during development (`FASTMCP_LOG_LEVEL: "INFO"`)
4. **Use the MCP Server view** in Kiro to monitor connection status

---

## General MCP Server Issues

### Server Not Starting

**Symptoms:**

- Server never connects
- Timeout errors

**Solutions:**

1. **Verify package installation:**

   ```powershell
   npx -y @upstash/context7-mcp --help
   ```

   Should display help text without errors.

2. **Check timeout settings:**
   - Increase `timeout` value in configuration (default: 30000ms)
   - Some servers need more time to start

3. **Review logs:**
   - Set `FASTMCP_LOG_LEVEL: "DEBUG"` for detailed logs
   - Check Kiro output panel for error messages

### Server Disconnects Frequently

**Symptoms:**

- Intermittent "Not connected" errors
- Works sometimes, fails other times

**Solutions:**

1. **Enable auto-restart:**

   ```json
   "restart": true
   ```

2. **Increase timeout:**

   ```json
   "timeout": 60000
   ```

3. **Check network connectivity** (for remote MCP servers)

### Tool Approval Prompts

**Symptoms:**

- Constant approval prompts for MCP tools
- Workflow interruptions

**Solution:**

Add tools to `autoApprove` array:

```json
"autoApprove": [
  "mcp_context7_resolve_library_id",
  "mcp_context7_get_library_docs"
]
```

---

## Configuration Best Practices

### Recommended Context7 Configuration

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "NODE_ENV": "development",
        "FASTMCP_LOG_LEVEL": "INFO"
      },
      "disabled": false,
      "autoApprove": [
        "mcp_context7_resolve_library_id",
        "mcp_context7_get_library_docs"
      ],
      "restart": true,
      "timeout": 30000
    }
  }
}
```

### Configuration Options Explained

| Option                  | Purpose                 | Recommended Value                 |
| ----------------------- | ----------------------- | --------------------------------- |
| `command`               | Executable to run       | `"npx"`                           |
| `args`                  | Command arguments       | `["-y", "@upstash/context7-mcp"]` |
| `env.NODE_ENV`          | Node environment        | `"development"` or `"production"` |
| `env.FASTMCP_LOG_LEVEL` | Logging verbosity       | `"INFO"` (dev), `"ERROR"` (prod)  |
| `disabled`              | Enable/disable server   | `false`                           |
| `autoApprove`           | Auto-approve tools      | List of tool names                |
| `restart`               | Auto-restart on failure | `true`                            |
| `timeout`               | Startup timeout (ms)    | `30000` (30 seconds)              |

### Multiple MCP Servers

You can configure multiple MCP servers:

```json
{
  "mcpServers": {
    "context7": {
      /* ... */
    },
    "github": {
      /* ... */
    },
    "shadcn": {
      /* ... */
    }
  }
}
```

Each server operates independently.

---

## Reconnection Methods

### Method 1: Configuration Change (Automatic)

1. Edit `.kiro/settings/mcp.json`
2. Make any change (add comment, modify env var)
3. Save file
4. Wait 3-5 seconds

### Method 2: MCP Server View (Manual)

1. Open Kiro feature panel
2. Navigate to "MCP Server" view
3. Find the disconnected server
4. Click "Reconnect" button

### Method 3: Command Palette (Manual)

1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Search for "MCP"
3. Select "Reconnect MCP Servers"

---

## Debugging Checklist

When MCP server issues occur:

- [ ] Check if server is configured in `.kiro/settings/mcp.json`
- [ ] Verify `disabled: false`
- [ ] Confirm package is accessible (`npx -y <package> --help`)
- [ ] Check timeout value (increase if needed)
- [ ] Enable debug logging (`FASTMCP_LOG_LEVEL: "DEBUG"`)
- [ ] Review Kiro output panel for errors
- [ ] Try manual reconnection via MCP Server view
- [ ] Restart Kiro as last resort

---

## Related Documentation

- [MCP Configuration Guide](../configuration/mcp-setup.md)
- [Kiro MCP Features](../features/mcp-integration.md)
- [Context7 Documentation](https://context7.ai/docs)

---

## Issue History

### 2025-10-04: Context7 Not Connected

**Issue:** Context7 MCP server showing "Not connected" error

**Solution:**

- Added `FASTMCP_LOG_LEVEL: "INFO"` to env
- Added `autoApprove` array with tool names
- Configuration change triggered automatic reconnection

**Prevention:** Always include autoApprove for frequently used tools

---

## Getting Help

If issues persist:

1. Check [Kiro Documentation](https://kiro.dev/docs)
2. Review [MCP Protocol Specification](https://modelcontextprotocol.io)
3. Search [Kiro Community Forums](https://community.kiro.dev)
4. File an issue on [GitHub](https://github.com/kiro/kiro/issues)
