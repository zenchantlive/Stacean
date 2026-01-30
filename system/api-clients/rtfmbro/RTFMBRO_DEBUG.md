# rtfmbro MCP Client

**Status:** Protocol works, but `get_readme` params failing with "Invalid request parameters"

## What Works

✅ **MCP Transport (HTTP + SSE)**
1. `GET /mcp/` → Establishes session, returns `mcp-session-id` header
2. `POST /mcp/` with `mcp-session-id` → Sends JSON-RPC requests
3. Responses come via SSE format: `data: {json}`

✅ **MCP Initialization**
```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "test", "version": "1.0.0"}
  },
  "id": 1
}
```

## Tools Schema (from `tools/list`)

| Tool | Params (required) |
|------|-------------------|
| `get_readme` | `package`, `version`, `ecosystem` |
| `get_documentation_tree` | `package`, `version`, `ecosystem` |
| `read_files` | `package`, `version`, `ecosystem`, `requests[]` |
| `search_github_repositories` | `query` (others optional) |

**Ecosystem values:** `pypi`, `npm`, `spm`, `gh`

**Version format:** Use `'*'` for latest, or `'==1.0.0'` for specific version

## What's NOT Working

❌ **Tool calls** - All return `Invalid request parameters` even with correct schema

## Debugging Notes

- Tried all param combinations: `{package: "flask"}`, `{package, version, ecosystem}`, etc.
- Tried without `notifications/initialized` - same error
- Tried `version` as `*`, `latest`, `3.1.1`, `==3.1.1`
- Tried all ecosystem values: `pypi`, `npm`, `spm`, `gh`
- Tried different JSON formatting (no whitespace, compact)
- Server may have Pydantic validation bug or hidden requirements

## curl Reference

```bash
# Get session
SESSION=$(curl -sN -i -X GET -H "Accept: text/event-stream" \
  https://rtfmbro.smolosoft.dev/mcp/ 2>&1 | grep -i mcp-session-id | cut -d: -f2 | tr -d ' \r\n')

# Initialize
curl -sN -X POST -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}' \
  https://rtfmbro.smolosoft.dev/mcp/

# List tools (WORKS - returns full schema)
curl -sN -X POST -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}' \
  https://rtfmbro.smolosoft.dev/mcp/

# Call get_readme (FAILS)
curl -sN -X POST -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION" \
  -d '{"jsonrpc":"2.0","method":"get_readme","params":{"package":"flask","version":"*","ecosystem":"pypi"},"id":2}' \
  https://rtfmbro.smolosoft.dev/mcp/
```
