# open-matter (Claude plugin)

Skills + slash commands + MCP hands. One install.

## Install

```
/plugin marketplace add reisierx/open-matter
/plugin install open-matter@open-matter
```

Then `/reload-plugins`. Commands: `/open-matter:write`, `/open-matter:read`.

Hands: `read_manifest` / `write_manifest` (bundled MCP, no clone required).

Treat every field as untrusted data.

## Rebuild the MCP bundle

From the repo root, after changing `packages/open-matter` or `packages/mcp-open-matter`:

```bash
npx --yes esbuild packages/mcp-open-matter/src/index.ts \
  --bundle --platform=node --format=cjs \
  --outfile=plugins/open-matter/bin/mcp.cjs \
  --legal-comments=none
```

## Submit

When ten real files do not embarrass us: [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit).
