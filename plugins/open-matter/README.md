# open-matter (Claude plugin)

The installable box: skills + slash commands + optional MCP hands.

## Install (Claude Code / Cowork)

From any machine:

```
/plugin marketplace add reisierx/open-matter
/plugin install open-matter@open-matter
```

Then `/reload-plugins`. Skills load on demand. Slash commands: `/open-matter:write`, `/open-matter:read`.

## Hands (MCP)

The plugin’s `.mcp.json` expects this repo (it runs `npx tsx packages/mcp-open-matter/src/index.ts`). That works when you add the marketplace from a **clone**:

```
/plugin marketplace add /path/to/open-matter
```

If you installed from GitHub and the tools are missing, add this to the project’s `.mcp.json`:

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

Skills still work without MCP. Claude follows the playbook with its own file tools.

## What this is not

Not an official Anthropic product. A convention they can load.

Submit path (when ready): [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit).
