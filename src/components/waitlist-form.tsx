import { useState } from "react";
import { joinWaitlist } from "@/lib/server/waitlist";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setMessage("");
    try {
      const res = await joinWaitlist({ data: { email } });
      if (res.ok) {
        setState("ok");
        setMessage("You are on the list. We will write when the archive desk opens.");
        setEmail("");
      } else {
        setState("err");
        setMessage(res.error);
      }
    } catch {
      setState("err");
      setMessage("The list could not be reached. Try again in a moment.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative mt-5 flex max-w-lg flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="waitlist-email">
        Email
      </label>
      <input
        id="waitlist-email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@press.example"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 flex-1 border border-rule bg-folio px-3 font-serif text-base text-ink placeholder:text-faint"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="h-11 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink hover:bg-oxblood-deep disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Join the list"}
      </button>
      {message ? (
        <p
          className={`sm:absolute sm:mt-14 ${state === "ok" ? "text-ok" : "text-warn"} text-sm`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
