import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Session, CreateSessionInput } from "@devgentic/shared";
import {
  listSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  exportSessions,
  importSessions,
} from "@/stores/session-db";

export function useSessions() {
  return useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: listSessions,
  });
}

export function useSession(id: string) {
  return useQuery<Session | undefined>({
    queryKey: ["sessions", id],
    queryFn: () => getSession(id),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSessionInput & { id: string }) => createSession(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<Session> & { id: string }) =>
      updateSession(id, updates),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["sessions", vars.id] });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useExportSessions() {
  return useMutation({ mutationFn: exportSessions });
}

export function useImportSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: importSessions,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}
