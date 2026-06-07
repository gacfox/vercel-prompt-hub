import { redis } from "@/lib/redis";
import { sql } from "@/lib/db";
import type { SessionData } from "@/lib/types";

const SESSION_PREFIX = "vph:session:";
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSession(
  userId: number,
  username: string,
  email: string
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const data: SessionData = { userId, username, email };

  await redis.set(`${SESSION_PREFIX}${sessionId}`, JSON.stringify(data), {
    ex: SESSION_TTL,
  });

  return sessionId;
}

export async function getSession(
  sessionId: string
): Promise<SessionData | null> {
  const data = await redis.get(`${SESSION_PREFIX}${sessionId}`);
  if (!data) return null;
  return data as SessionData;
}

export async function destroySession(sessionId: string): Promise<void> {
  await redis.del(`${SESSION_PREFIX}${sessionId}`);
}

export async function getUserById(id: number) {
  const users = await sql`
    SELECT id, username, email, created_at, updated_at
    FROM vph_users WHERE id = ${id}
  `;
  return users[0] || null;
}

export async function getUserByUsernameOrEmail(identifier: string) {
  const users = await sql`
    SELECT id, username, email, password_hash, created_at, updated_at
    FROM vph_users WHERE username = ${identifier} OR email = ${identifier}
  `;
  return users[0] || null;
}

export async function createUser(
  username: string,
  email: string,
  password: string
) {
  const passwordHash = await hashPassword(password);
  const result = await sql`
    INSERT INTO vph_users (username, email, password_hash)
    VALUES (${username}, ${email}, ${passwordHash})
    RETURNING id, username, email, created_at, updated_at
  `;
  return result[0];
}

/**
 * Get current user from request headers (injected by middleware).
 * Returns null if not logged in.
 */
export async function getCurrentUser(
  headers: Headers
): Promise<SessionData | null> {
  const userId = headers.get("x-vph-user-id");
  const username = headers.get("x-vph-username");
  const email = headers.get("x-vph-email");

  if (!userId || !username || !email) return null;

  return {
    userId: parseInt(userId, 10),
    username,
    email,
  };
}

/**
 * Parse session from cookie and return session data.
 * Used in API routes that don't go through middleware header injection.
 */
export async function getSessionFromCookie(
  cookieHeader: string | null
): Promise<SessionData | null> {
  if (!cookieHeader) return null;

  const match = cookieHeader.match(/vph-session=([^;]+)/);
  if (!match) return null;

  return getSession(match[1]);
}
