"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { PageState } from "@/components/page-header";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col gap-4">
      <PageState load={{ status: "error", message: safeMessage(error) }} />
      {/* A digest is the only handle on a server-side stack, and an operator
          pasting it into a channel beats pasting a screenshot. */}
      {error.digest ? (
        <p className="font-mono text-[11px] text-[var(--muted)]">digest {error.digest}</p>
      ) : null}
      <div>
        <button type="button" onClick={reset} className="btn btn-primary">
          <RotateCcw size={14} aria-hidden />
          Try again
        </button>
      </div>
    </div>
  );
}

/* Error text ends up on a screen this app deploys publicly; an Error thrown
   by a driver can carry a connection string in its message. */
function safeMessage(error: Error) {
  const message = error.message?.trim();
  if (!message) return "Something in this section threw while rendering.";
  return message.length > 200 ? `${message.slice(0, 200)}…` : message;
}
