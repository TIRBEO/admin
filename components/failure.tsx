import Link from "next/link";
import { State } from "@/components/primitives";
import { errorMessage, type ApiResult } from "@/lib/api";
import { signInUrl } from "@/lib/sign-in";

/** One place that decides what a failed read looks like.
 *
 *  A signed-out operator, a signed-in operator who is not an admin, and an
 *  unreachable API are three different problems with three different fixes.
 *  Collapsing them into "request failed" tells the reader nothing, and
 *  shows zeros nowhere — a failed read says so rather than implying the
 *  platform has nothing. */
export async function Failure({
  result,
  what,
}: {
  result: ApiResult<unknown>;
  /** What was being read, e.g. "the blocklist". */
  what: string;
}) {
  if (result.status === 401) {
    return (
      <State
        tone="warn"
        title="You are not signed in"
        body={`The API refused to describe ${what} because this browser sent no session. Sign in and you will come straight back here.`}
        action={
          <Link
            href={await signInUrl()}
            className="btn btn-primary"
          >
            Sign in
          </Link>
        }
      />
    );
  }

  if (result.status === 403) {
    return (
      <State
        tone="danger"
        title="This account is not an administrator"
        body={`You are signed in, but ${what} is restricted to admins. Nothing below is hidden from you — it was never fetched.`}
      />
    );
  }

  if (result.status === 0) {
    return (
      <State
        tone="warn"
        title="Cannot reach the API"
        body={`The request for ${what} never got an answer. The admin panel shows nothing rather than inventing figures.`}
      />
    );
  }

  return (
    <State
      tone="danger"
      title={errorMessage(result)}
      body={`The API answered ${result.status} when asked for ${what}.`}
    />
  );
}
