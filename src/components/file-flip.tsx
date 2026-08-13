import { useEffect, useState } from "react";

const FORMS = ["PDF", "DOCX", "EPUB", "HTML"] as const;

/** Beachhead is PDF. The word flips so the sentence is about files, not one format. */
export function FileFlip() {
  const [i, setI] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % FORMS.length), 2400);
    return () => window.clearInterval(id);
  }, [reduce]);

  if (reduce) return <span>PDF</span>;

  return (
    <span className="relative inline-block h-[1.05em] w-[4.6ch] overflow-hidden align-baseline">
      {FORMS.map((word, idx) => (
        <span
          key={word}
          aria-hidden={idx !== i}
          className={`absolute inset-x-0 top-0 transition-[opacity,transform,filter] duration-300 ease-out ${
            idx === i
              ? "translate-y-0 opacity-100 blur-none"
              : "translate-y-3 opacity-0 blur-[4px]"
          }`}
        >
          {word}
        </span>
      ))}
      <span className="invisible">{FORMS[0]}</span>
    </span>
  );
}
