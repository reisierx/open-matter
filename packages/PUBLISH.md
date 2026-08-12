# Publishing the libraries

Do this only after the GitHub repo is public and you have npm / PyPI accounts (see `FOUNDER_TODO.md`).

## npm (`pdf-frontmatter`)

From the repo root, after `npm install`:

```bash
cd packages/pdf-frontmatter
npm publish --access public
```

The package is source TypeScript. Consumers on modern Node/Vite resolve it. If a reviewer wants a built `dist/`, add a `tsup` step later — not required for 0.1.

## PyPI (`pdf-frontmatter`)

```bash
cd packages/pdf-frontmatter-py
python3 -m pip install build twine
python3 -m build
python3 -m twine upload dist/*
```

## MCP

The MCP server is not published as a package. Point an MCP client at:

```
node --experimental-strip-types packages/mcp-pdf-frontmatter/src/index.ts
```
