import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Repo, CreateRepoInput, UpdateRepoInput } from "@devgentic/shared";
import { api } from "@/lib/api";

export function useRepos() {
  return useQuery<Repo[]>({
    queryKey: ["repos"],
    queryFn: () => api.get("/repos"),
  });
}

export function useRepo(id: string) {
  return useQuery<Repo>({
    queryKey: ["repos", id],
    queryFn: () => api.get(`/repos/${id}`),
    enabled: !!id,
  });
}

export function useCreateRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRepoInput) => api.post<Repo>("/repos", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repos"] }),
  });
}

export function useUpdateRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateRepoInput & { id: string }) =>
      api.put<Repo>(`/repos/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repos"] }),
  });
}

export function useDeleteRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/repos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repos"] }),
  });
}
