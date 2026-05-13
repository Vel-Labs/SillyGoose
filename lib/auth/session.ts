import { cookies } from "next/headers";
import { addAudit, newId, readStore, updateStore } from "./store";

export const SESSION_COOKIE = "silly_goose_session";

export async function createSession(userId: string) {
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
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 12
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
