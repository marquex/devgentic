import type { Repo } from "@devgentic/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitFork, Trash2, ExternalLink } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  cloning: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
};

interface RepoCardProps {
  repo: Repo;
  onDelete: (id: string) => void;
}

export function RepoCard({ repo, onDelete }: RepoCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitFork className="h-4 w-4" />
          {repo.name}
        </CardTitle>
        <Badge className={statusColors[repo.status] ?? ""} variant="secondary">
          {repo.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline"
          >
            {repo.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        {repo.error && (
          <p className="mt-2 text-sm text-destructive">{repo.error}</p>
        )}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Branch: {repo.defaultBranch}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(repo.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
