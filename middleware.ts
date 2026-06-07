import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { redis } from "@/lib/redis";
import { sql } from "@/lib/db";

const SESSION_PREFIX = "vph:session:";
const DB_INIT_KEY = "vph:db-initialized";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if database is initialized (skip for setup routes)
  if (pathname !== "/setup" && pathname !== "/api/setup") {
    try {
      const initialized = await redis.get(DB_INIT_KEY);
      if (!initialized) {
        return NextResponse.redirect(new URL("/setup", request.url));
      }
    } catch {
      // Redis error — allow request through, setup page will handle it
    }
  }

  // If on setup page but already initialized, redirect to home
  if (pathname === "/setup") {
    try {
      const initialized = await redis.get(DB_INIT_KEY);
      if (initialized) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      // Redis error — let setup page handle it
    }
  }

  // Check session
  const sessionId = request.cookies.get("vph-session")?.value;

  if (!sessionId) {
    return NextResponse.next();
  }

  try {
    const sessionData = await redis.get(`${SESSION_PREFIX}${sessionId}`);
    if (!sessionData) {
      // Session expired or invalid — clear cookie
      const response = NextResponse.next();
      response.cookies.set("vph-session", "", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    const session = sessionData as { userId: number; username: string; email: string };

    // Inject user info into request headers for downstream consumption
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-vph-user-id", String(session.userId));
    requestHeaders.set("x-vph-username", session.username);
    requestHeaders.set("x-vph-email", session.email);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch (error) {
    console.error("[vph] Session lookup error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
