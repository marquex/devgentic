import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRepos } from "@/hooks/use-repos";
import {
  useSessions,
  useDeleteSession,
  useUpdateSession,
  useExportSessions,
  useImportSessions,
} from "@/hooks/use-sessions";
import { SessionList } from "@/components/session/session-list";
import { Plus, GitFork, Zap, FolderOpen, Download, Upload } from "lucide-react";
import { toast } from "sonner";

export function DashboardPage() {
  const { data: repos } = useRepos();
  const { data: sessions } = useSessions();
  const deleteSession = useDeleteSession();
  const updateSession = useUpdateSession();
  const exportSessions = useExportSessions();
  const importSessions = useImportSessions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readyRepos = repos?.filter((r) => r.status === "ready").length ?? 0;
  const activeSessions = sessions?.filter((s) => s.status === "active") ?? [];

  function handleDelete(id: string) {
    deleteSession.mutate(id, {
      onSuccess: () => toast.success("Session deleted"),
    });
  }

  function handleArchive(id: string) {
    updateSession.mutate(
      { id, status: "archived" },
      { onSuccess: () => toast.success("Session archived") }
    );
  }

  function handleExport() {
    exportSessions.mutate(undefined, {
      onSuccess: (json) => {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `devgentic-sessions-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Sessions exported");
      },
    });
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importSessions.mutate(reader.result as string, {
        onSuccess: (count) => toast.success(`Imported ${count} sessions`),
        onError: (err) => toast.error(`Import failed: ${err.message}`),
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your agentic development sessions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-1 h-4 w-4" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button asChild>
            <Link to="/sessions/new">
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Repos</CardTitle>
            <GitFork className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repos?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">{readyRepos} ready</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              {sessions?.length ?? 0} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/repos">Manage Repos</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>
            Your development workflow sessions will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionList
            sessions={sessions ?? []}
            onDelete={handleDelete}
            onArchive={handleArchive}
          />
        </CardContent>
      </Card>
    </div>
  );
}
