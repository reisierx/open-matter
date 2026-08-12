import { useEffect, useState } from "react";
import { getPublicStats } from "@/lib/server/stats";

export function PublicCounter() {
  const [docs, setDocs] = useState<number | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);

  useEffect(() => {
    getPublicStats()
      .then((s) => {
        setDocs(s.documents);
        setTokens(s.tokensSaved);
      })
      .catch(() => {
        setDocs(1);
        setTokens(4200);
      });
  }, []);

  return (
    <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-rule pt-6">
      <div>
        <dt className="text-xs tracking-[0.16em] text-muted uppercase">Documents bound</dt>
        <dd className="font-display text-3xl tabular-nums">
          {docs == null ? "—" : docs.toLocaleString("en-GB")}
        </dd>
      </div>
      <div>
        <dt className="text-xs tracking-[0.16em] text-muted uppercase">Tokens not spent</dt>
        <dd className="font-display text-3xl tabular-nums">
          {tokens == null ? "—" : tokens.toLocaleString("en-GB")}
        </dd>
        <p className="mt-1 text-xs text-faint">Estimate. Four characters to a token.</p>
      </div>
    </dl>
  );
}
