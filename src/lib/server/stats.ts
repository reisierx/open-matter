import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";
import { allowRequest, clientKey } from "./rate-limit";

export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<{ key: string; value: number | string }>`
    select key, value from stats
    where key in ('documents_enriched', 'tokens_saved')
  `;
  const map = Object.fromEntries(rows.map((r) => [r.key, Number(r.value)]));
  return {
    documents: map.documents_enriched ?? 1,
    tokensSaved: map.tokens_saved ?? 4200,
  };
});

export const recordEnrichment = createServerFn({ method: "POST" })
  .validator((input: { tokensSaved: number }) => ({
    tokensSaved: Math.max(0, Math.min(2_000_000, Math.floor(Number(input.tokensSaved) || 0))),
  }))
  .handler(async ({ data }) => {
    const request = getRequest();
    if (request) {
      const gate = allowRequest(clientKey(request, "enrich"), 20, 10 * 60 * 1000);
      if (!gate.ok) return { ok: false as const };
    }
    const sql = await getSql();
    await sql`update stats set value = value + 1 where key = 'documents_enriched'`;
    await sql`update stats set value = value + ${data.tokensSaved} where key = 'tokens_saved'`;
    return { ok: true as const };
  });
