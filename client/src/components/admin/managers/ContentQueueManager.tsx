import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Copy,
  Pencil,
  FileText,
  Filter,
} from "lucide-react";

type StatusFilter = "all" | "draft" | "approved" | "rejected";

export function ContentQueueManager() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingItem, setEditingItem] = useState<{ id: number; content: string } | null>(null);
  const [editContent, setEditContent] = useState("");

  const utils = trpc.useUtils();
  const { data: items, isLoading } = trpc.contentQueue.list.useQuery({ status: statusFilter });

  const reviewMutation = trpc.contentQueue.review.useMutation({
    onSuccess: () => {
      utils.contentQueue.list.invalidate();
      setEditingItem(null);
      toast.success("Content reviewed successfully");
    },
    onError: (error) => {
      toast.error("Review failed", { description: error.message });
    },
  });

  const handleApprove = (id: number) => {
    reviewMutation.mutate({ id, status: "approved" });
  };

  const handleReject = (id: number) => {
    reviewMutation.mutate({ id, status: "rejected" });
  };

  const handleEditApprove = () => {
    if (!editingItem) return;
    reviewMutation.mutate({
      id: editingItem.id,
      status: "approved",
      content: editContent,
    });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const openEdit = (id: number, content: string) => {
    setEditingItem({ id, content });
    setEditContent(content);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "approved":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Stats
  const draftCount = items?.filter((i: any) => i.status === "draft").length ?? 0;
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const approvedThisWeek =
    items?.filter(
      (i: any) => i.status === "approved" && i.reviewedAt && new Date(i.reviewedAt) >= weekStart
    ).length ?? 0;
  const rejectedThisWeek =
    items?.filter(
      (i: any) => i.status === "rejected" && i.reviewedAt && new Date(i.reviewedAt) >= weekStart
    ).length ?? 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Queue
          </CardTitle>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">
            Pending: <span className="font-semibold text-foreground">{draftCount}</span>
          </span>
          <span className="text-muted-foreground">
            Approved this week: <span className="font-semibold text-green-600">{approvedThisWeek}</span>
          </span>
          <span className="text-muted-foreground">
            Rejected this week: <span className="font-semibold text-red-600">{rejectedThisWeek}</span>
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(["all", "draft", "approved", "rejected"] as StatusFilter[]).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {!items || items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No content items found.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {item.sessionTitle && (
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {item.sessionTitle}
                      </p>
                    )}
                    <p className="text-sm">{item.content}</p>
                  </div>
                  {statusBadge(item.status)}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {item.platform} · Generated{" "}
                    {new Date(item.generatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(item.content)}
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {item.status === "draft" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(item.id, item.content)}
                          title="Edit & Approve"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleApprove(item.id)}
                          disabled={reviewMutation.isPending}
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleReject(item.id)}
                          disabled={reviewMutation.isPending}
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit + Approve Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit & Approve</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {editContent.length}/500
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditApprove}
                disabled={reviewMutation.isPending || !editContent.trim()}
              >
                {reviewMutation.isPending ? "Saving..." : "Approve"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
