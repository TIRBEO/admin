/* A screen can be waiting, legitimately empty, or failed — and the three need
   drawing, because a table that renders nothing cannot tell an operator whether
   the filter matched nobody or the API never answered.

   Every screen reaches this through a real request, so a failure here means a
   request actually failed. There is no URL param that conjures an error branch:
   the reason travels with the failure instead. */

import type { ReactNode } from "react";

/** Which kind of failure this is. A signed-out operator, an operator whose role
    does not cover this screen, and an API that never answered are three
    different problems with three different fixes, so the screen gets to say
    which one it is showing rather than guessing from the message text. */
export type FailureReason = "signed-out" | "not-permitted" | "unreachable";

export type LoadError = {
  status: "error";
  message: string;
  reason?: FailureReason;
  action?: ReactNode;
};

export type Load<T> =
  | { status: "loading" }
  | { status: "empty" }
  | LoadError
  | { status: "ready"; data: T };
