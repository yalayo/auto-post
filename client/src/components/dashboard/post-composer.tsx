import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PostComposerProps {
  userId: string;
}

interface GeneratedPost {
  content: string;
  suggestedHashtags?: string[];
}

export default function PostComposer({ userId }: PostComposerProps) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [hashtags, setHashtags] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [saveAs, setSaveAs] = useState("draft");
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // Get LinkedIn accounts for selection
  const { data: accounts } = useQuery({
    queryKey: ['/api/user', userId, 'linkedin-accounts'],
    enabled: !!userId,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { prompt: string; tone: string; length: string; hashtags?: string }) => {
      const response = await apiRequest('POST', '/api/posts/generate', data);
      return response.json();
    },
    onSuccess: (data: GeneratedPost) => {
      setGeneratedPost(data);
      setShowPreview(true);
      toast({
        title: "Success!",
        description: "Post generated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', '/api/posts', {
        userId,
        linkedinAccountId: selectedAccount || null,
        content,
        prompt,
        tone,
        hashtags,
        status: saveAs,
      });
      return response.json();
    },
    onSuccess: () => {
      const actionText = saveAs === 'published' ? 'published' : 'saved as draft';
      toast({
        title: "Success!",
        description: `Your post has been ${actionText}.`,
      });
      setShowPreview(false);
      setGeneratedPost(null);
      setPrompt("");
      setHashtags("");
      // Invalidate queries to refresh the posts list
      queryClient.invalidateQueries({ queryKey: ['/api/user', userId, 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user', userId, 'stats'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${saveAs === 'published' ? 'publish' : 'save'} post. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    generateMutation.mutate({
      prompt,
      tone,
      length,
      hashtags: hashtags || undefined,
    });
  };

  const handleSave = () => {
    if (generatedPost) {
      saveMutation.mutate(generatedPost.content);
    }
  };

  const linkedinAccounts = (accounts as any[]) || [];

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Create New Post</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>AI Ready</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <Label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              AI Prompt
            </Label>
            <Textarea
              id="prompt"
              rows={3}
              className="w-full resize-none"
              placeholder="Describe what you want to post about... (e.g., 'Write about the importance of networking in tech careers')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="inspirational">Inspirational</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="hashtags" className="block text-sm font-medium text-gray-700 mb-2">
              Hashtags <span className="text-gray-500 text-xs">(optional)</span>
            </Label>
            <Input
              id="hashtags"
              placeholder="#technology #career #networking"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full linkedin-gradient"
            disabled={generateMutation.isPending || !prompt.trim()}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            {generateMutation.isPending ? "Generating..." : "Generate with AI"}
          </Button>
        </form>

        {/* Post Preview */}
        {showPreview && generatedPost && (
          <div className="pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Generated Post Preview</h4>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                  {userId.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Your LinkedIn Post</div>
                  <div className="text-xs text-gray-500">Preview</div>
                  <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
                    {generatedPost.content}
                  </div>
                </div>
              </div>
            </div>

            {/* LinkedIn Account Selection */}
            <div className="mb-4 space-y-3">
              <Label className="block text-sm font-medium text-gray-700">LinkedIn Account</Label>
              {linkedinAccounts.length > 0 ? (
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an account (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No account (save as draft)</SelectItem>
                    {linkedinAccounts.map((account: any) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-blue-600 p-3 bg-blue-50 rounded border border-blue-200">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Connect a LinkedIn account to publish directly. For now, post will be saved as draft.
                </div>
              )}

              <Label className="block text-sm font-medium text-gray-700">Action</Label>
              <Select value={saveAs} onValueChange={setSaveAs}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Save as Draft</SelectItem>
                  {selectedAccount && <SelectItem value="published">Publish Now</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowPreview(false)}
              >
                Edit Post
              </Button>
              <Button 
                className="flex-1 linkedin-gradient"
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : saveAs === 'published' ? "Publish Now" : "Save Draft"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
