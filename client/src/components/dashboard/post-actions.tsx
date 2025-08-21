import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface PostActionsProps {
  post: any;
  userId: string;
}

export function PostActions({ post, userId }: PostActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('PUT', `/api/posts/${post.id}`, { content });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Post updated successfully.",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/user', userId, 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user', userId, 'stats'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update post.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/posts/${post.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Post deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user', userId, 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user', userId, 'stats'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete post.",
        variant: "destructive",
      });
    },
  });

  const handleSaveEdit = () => {
    if (editedContent.trim()) {
      updateMutation.mutate(editedContent);
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsViewDialogOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl" aria-describedby="view-post-description">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
            <p id="view-post-description" className="text-sm text-gray-600">View the full post content and details</p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {post.content}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium capitalize">{post.status}</span>
              </div>
              <div>
                <span className="text-gray-600">Tone:</span>
                <span className="ml-2 font-medium capitalize">{post.tone}</span>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2 font-medium">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              {post.scheduledAt && (
                <div>
                  <span className="text-gray-600">Scheduled:</span>
                  <span className="ml-2 font-medium">{new Date(post.scheduledAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            {post.hashtags && (
              <div>
                <span className="text-gray-600 text-sm">Hashtags:</span>
                <div className="mt-1 text-sm text-blue-600">{post.hashtags}</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl" aria-describedby="edit-post-description">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <p id="edit-post-description" className="text-sm text-gray-600">Make changes to your post content</p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </Label>
              <Textarea
                id="edit-content"
                rows={8}
                className="w-full resize-none"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending || !editedContent.trim()}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}