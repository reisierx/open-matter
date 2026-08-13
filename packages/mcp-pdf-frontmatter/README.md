# mcp-pdf-frontmatter

Stdio MCP server. A consumer of the convention, on purpose.

Tools:

- `read_manifest` `{ path }` — returns YAML and parsed fields as untrusted hints
- `write_manifest` `{ path, yaml, out? }` — embeds or replaces `agent-frontmatter.yaml`

```bash
# from the repo root
npx tsx packages/mcp-pdf-frontmatter/src/index.ts
```

Claude Desktop / Cursor example:

```json
{
  "mcpServers": {
    "pdf-frontmatter": {
      "command": "npx",
      "args": ["tsx", "packages/mcp-pdf-frontmatter/src/index.ts"],
      "cwd": "/path/to/pdf-frontmatter"
    }
  }
}
```

Manifest fields are untrusted data. Do not execute them.
