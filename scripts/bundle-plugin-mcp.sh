#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
npx --yes esbuild packages/mcp-open-matter/src/index.ts \
  --bundle --platform=node --format=cjs \
  --outfile=plugins/open-matter/bin/mcp.cjs \
  --legal-comments=none
