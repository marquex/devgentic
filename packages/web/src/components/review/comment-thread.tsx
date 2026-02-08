import { useState } from "react";
import type { ReviewComment } from "@devgentic/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Check, MessageSquare, Trash2 } from "lucide-react";

interface CommentThreadProps {
  comments: ReviewComment[];
  onAdd: (comment: Omit<ReviewComment, "id" | "createdAt">) => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CommentThread({ comments, onAdd, onResolve, onDelete }: CommentThreadProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [filePath, setFilePath] = useState("");
  const [content, setContent] = useState("");

  function handleAdd() {
    onAdd({
      filePath,
      lineNumber: null,
      content,
      resolved: false,
    });
    setFilePath("");
    setContent("");
    setIsAdding(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="h-4 w-4" />
          Review Comments ({comments.length})
        </h3>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="mr-1 h-3 w-3" />
          Add Comment
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div>
              <Label htmlFor="file-path">File Path</Label>
              <Input
                id="file-path"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="specs/overview.md"
              />
            </div>
            <div>
              <Label htmlFor="comment-content">Comment</Label>
              <Textarea
                id="comment-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe the change needed..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!content.trim()}>
                Add
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {comments.map((comment) => (
        <Card key={comment.id} className={comment.resolved ? "opacity-60" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
            <CardTitle className="text-xs font-mono text-muted-foreground">
              {comment.filePath}
            </CardTitle>
            <div className="flex gap-1">
              {comment.resolved ? (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  Resolved
                </Badge>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => onResolve(comment.id)}>
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(comment.id)}
                className="text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <p className="text-sm">{comment.content}</p>
          </CardContent>
        </Card>
      ))}

      {comments.length === 0 && !isAdding && (
        <p className="text-center text-sm text-muted-foreground py-4">
          No comments yet. Add comments to request changes to the specs.
        </p>
      )}
    </div>
  );
}
