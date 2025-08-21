import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

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

  const publishMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', '/api/posts', {
        userId,
        linkedinAccountId: 'demo-account', // Would be selected from connected accounts
        content,
        prompt,
        tone,
        hashtags,
        status: 'published',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Published!",
        description: "Your post has been published to LinkedIn.",
      });
      setShowPreview(false);
      setGeneratedPost(null);
      setPrompt("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to publish post. Please try again.",
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

  const handlePublish = () => {
    if (generatedPost) {
      publishMutation.mutate(generatedPost.content);
    }
  };

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
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50" 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">John Miller</div>
                  <div className="text-xs text-gray-500">Product Manager at TechCorp</div>
                  <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
                    {generatedPost.content}
                  </div>
                </div>
              </div>
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
                onClick={handlePublish}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? "Publishing..." : "Publish Now"}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-amber-500 text-amber-600 hover:bg-amber-50"
              >
                Schedule
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
