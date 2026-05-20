import { cookies } from "next/headers";
import { addAudit, newId, readStore, updateStore } from "./store";

export const SESSION_COOKIE = "silly_goose_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function requestUsesHttps(request?: Request) {
  if (request) {
    const forwardedProto = request.headers.get("x-forwarded-proto");
    if (forwardedProto) return forwardedProto.split(",")[0]?.trim() === "https";
    return new URL(request.url).protocol === "https:";
  }
  const configuredOrigin = process.env.WEBAUTHN_ORIGIN || process.env.NEXT_PUBLIC_APP_ORIGIN || "";
  return configuredOrigin.startsWith("https://");
}

export async function createSession(userId: string, request?: Request) {
  const session = await updateStore((store) => {
    const nextSession = { id: newId("sess"), userId, createdAt: new Date().toISOString() };
    store.sessions = store.sessions.filter((candidate) => candidate.userId !== userId);
    store.sessions.push(nextSession);
    return nextSession;
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: requestUsesHttps(request),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
  await addAudit("Security Key session opened for a verified goose.", "auth");
  return session;
}

export async function getCurrentUser() {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  const store = await readStore();
  const session = store.sessions.find((candidate) => candidate.id === sessionId);
  if (!session) return null;
  return store.users.find((user) => user.id === session.userId) ?? null;
}

export async function clearSession() {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await updateStore((store) => {
      store.sessions = store.sessions.filter((candidate) => candidate.id !== sessionId);
    });
  }
  jar.delete(SESSION_COOKIE);
}
