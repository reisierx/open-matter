import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";
import { allowRequest, clientKey } from "./rate-limit";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const joinWaitlist = createServerFn({ method: "POST" })
  .validator((input: { email: string }) => ({
    email: String(input.email ?? "").trim().toLowerCase(),
  }))
  .handler(async ({ data }) => {
    if (!EMAIL.test(data.email) || data.email.length > 200) {
      return { ok: false as const, error: "That does not look like an email address." };
    }
    const request = getRequest();
    if (request) {
      const gate = allowRequest(clientKey(request, "wait"), 8, 10 * 60 * 1000);
      if (!gate.ok) {
        return {
          ok: false as const,
          error: `A few addresses have already been sent from here. Try again in ${Math.ceil(gate.retryAfterSec / 60)} minutes.`,
        };
      }
    }
    const sql = await getSql();
    await sql`
      insert into waitlist (email) values (${data.email})
      on conflict (email) do nothing
    `;
    return { ok: true as const };
  });
