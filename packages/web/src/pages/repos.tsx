import { useRepos, useCreateRepo, useDeleteRepo } from "@/hooks/use-repos";
import { RepoCard } from "@/components/repo/repo-card";
import { RepoForm } from "@/components/repo/repo-form";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function ReposPage() {
  const { data: repos, isLoading } = useRepos();
  const createRepo = useCreateRepo();
  const deleteRepo = useDeleteRepo();

  function handleCreate(data: { name: string; url: string }) {
    createRepo.mutate(data, {
      onSuccess: () => toast.success("Repository added — cloning started"),
      onError: (err) => toast.error(err.message),
    });
  }

  function handleDelete(id: string) {
    deleteRepo.mutate(id, {
      onSuccess: () => toast.success("Repository removed"),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Repositories</h1>
          <p className="text-muted-foreground">
            Connect repositories for agentic development workflows.
          </p>
        </div>
        <RepoForm onSubmit={handleCreate} isPending={createRepo.isPending} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : repos?.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No repositories connected yet. Add one to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repos?.map((repo) => (
            <RepoCard key={repo.id} repo={repo} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
