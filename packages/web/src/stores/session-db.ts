import { openDB, type IDBPDatabase } from "idb";
import type { Session, CreateSessionInput } from "@devgentic/shared";
import { IDB_NAME, IDB_VERSION, IDB_SESSIONS_STORE } from "@devgentic/shared";

function getDb(): Promise<IDBPDatabase> {
  return openDB(IDB_NAME, IDB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(IDB_SESSIONS_STORE)) {
        const store = db.createObjectStore(IDB_SESSIONS_STORE, { keyPath: "id" });
        store.createIndex("status", "status");
        store.createIndex("repoId", "repoId");
        store.createIndex("updatedAt", "updatedAt");
      }
    },
  });
}

export async function listSessions(): Promise<Session[]> {
  const db = await getDb();
  const all = await db.getAll(IDB_SESSIONS_STORE);
  return all.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getSession(id: string): Promise<Session | undefined> {
  const db = await getDb();
  return db.get(IDB_SESSIONS_STORE, id);
}

export async function createSession(input: CreateSessionInput & { id: string }): Promise<Session> {
  const db = await getDb();
  const now = new Date().toISOString();
  const session: Session = {
    id: input.id,
    name: input.name,
    repoId: input.repoId,
    repoName: input.repoName,
    currentStep: "prompt",
    status: "active",
    chatHistory: [],
    finalPrompt: null,
    specBranch: null,
    specPrUrl: null,
    specContent: null,
    reviewComments: [],
    reviewStatus: "pending",
    executionPhase: null,
    executionBranch: null,
    executionPrUrl: null,
    executionLog: [],
    createdAt: now,
    updatedAt: now,
  };
  await db.put(IDB_SESSIONS_STORE, session);
  return session;
}

export async function updateSession(
  id: string,
  updates: Partial<Session>
): Promise<Session | undefined> {
  const db = await getDb();
  const session = await db.get(IDB_SESSIONS_STORE, id);
  if (!session) return undefined;
  const updated = { ...session, ...updates, updatedAt: new Date().toISOString() };
  await db.put(IDB_SESSIONS_STORE, updated);
  return updated;
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(IDB_SESSIONS_STORE, id);
}

export async function exportSessions(): Promise<string> {
  const sessions = await listSessions();
  return JSON.stringify(sessions, null, 2);
}

export async function importSessions(json: string): Promise<number> {
  const db = await getDb();
  const sessions: Session[] = JSON.parse(json);
  const tx = db.transaction(IDB_SESSIONS_STORE, "readwrite");
  for (const session of sessions) {
    await tx.store.put(session);
  }
  await tx.done;
  return sessions.length;
}
