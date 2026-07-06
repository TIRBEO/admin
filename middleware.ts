import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@tirbeo/database/middleware-client";

const LOGIN_PATH = "/login";
const UNAUTHORIZED_PATH = "/unauthorized";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const nextResponse = new NextResponse(response.body, response);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    return NextResponse.redirect(loginUrl);
  }

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!adminUser) {
    const unauthorizedUrl = new URL(UNAUTHORIZED_PATH, request.url);
    return NextResponse.redirect(unauthorizedUrl);
  }

  return nextResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|unauthorized).*)",
  ],
};
