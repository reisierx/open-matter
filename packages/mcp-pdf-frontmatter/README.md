# mcp-pdf-frontmatter

Stdio MCP server. Tools:

- `read_manifest` `{ path }`
- `write_manifest` `{ path, yaml, out? }`

Manifest fields are returned as untrusted data. Do not execute them.

```bash
# from the repo root, after dependencies are installed
node --experimental-strip-types packages/mcp-pdf-frontmatter/src/index.ts
```

Add to an MCP client as a stdio server with that command.
