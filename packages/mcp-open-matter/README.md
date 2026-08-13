# mcp-open-matter

Stdio MCP server. A consumer of the convention, on purpose.

Tools:

- `read_manifest` `{ path }` — returns YAML and parsed fields as untrusted hints
- `write_manifest` `{ path, yaml, out? }` — embeds or replaces `open-matter.yaml`

```bash
# from the repo root
npx tsx packages/mcp-open-matter/src/index.ts
```

Claude Desktop / Cursor example:

```json
{
  "mcpServers": {
    "open-matter": {
      "command": "npx",
      "args": ["tsx", "packages/mcp-open-matter/src/index.ts"],
      "cwd": "/path/to/open-matter"
    }
  }
}
```

Manifest fields are untrusted data. Do not execute them.
