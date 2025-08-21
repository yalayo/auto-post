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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface BulkPostGeneratorProps {
  userId: string;
}

interface BulkGenerationResult {
  success: boolean;
  generated: number;
  total: number;
  posts: any[];
  errors?: string[];
}

export default function BulkPostGenerator({ userId }: BulkPostGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [hashtags, setHashtags] = useState("");
  const [count, setCount] = useState(5);
  const [startDate, setStartDate] = useState("");
  const [intervalHours, setIntervalHours] = useState(24);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [result, setResult] = useState<BulkGenerationResult | null>(null);
  const { toast } = useToast();

  // Get LinkedIn accounts for selection
  const { data: accounts } = useQuery({
    queryKey: ['/api/user', userId, 'linkedin-accounts'],
    enabled: !!userId,
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/posts/bulk-generate', data);
      return response.json();
    },
    onSuccess: (data: BulkGenerationResult) => {
      setResult(data);
      toast({
        title: "Success!",
        description: `Generated ${data.generated} posts successfully!`,
      });
      // Invalidate queries to refresh the posts list
      queryClient.invalidateQueries({ queryKey: ['/api/user', userId, 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user', userId, 'stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate posts. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !selectedAccount || !startDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    bulkGenerateMutation.mutate({
      prompt,
      tone,
      length,
      hashtags: hashtags || undefined,
      count,
      userId,
      linkedinAccountId: selectedAccount,
      startDate,
      intervalHours,
    });
  };

  const handleReset = () => {
    setPrompt("");
    setHashtags("");
    setCount(5);
    setStartDate("");
    setIntervalHours(24);
    setSelectedAccount("");
    setResult(null);
  };

  const linkedinAccounts = (accounts as any[]) || [];

  // Set default start date to tomorrow at 9 AM
  const defaultStartDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="linkedin-gradient">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          Bulk Generate Posts
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Bulk Post Generator</DialogTitle>
          <p className="text-sm text-gray-600">Generate multiple LinkedIn posts and schedule them automatically</p>
        </DialogHeader>

        {!result ? (
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <Label htmlFor="bulk-prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Content Prompt <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="bulk-prompt"
                rows={3}
                className="w-full resize-none"
                placeholder="Describe the topic you want to create posts about... (e.g., 'Tips for remote work productivity')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
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
              <Label htmlFor="bulk-hashtags" className="block text-sm font-medium text-gray-700 mb-2">
                Hashtags <span className="text-gray-500 text-xs">(optional)</span>
              </Label>
              <Input
                id="bulk-hashtags"
                placeholder="#technology #productivity #career"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Posts <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="20"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Max 20 posts</p>
              </div>
              <div>
                <Label htmlFor="interval" className="block text-sm font-medium text-gray-700 mb-2">
                  Interval (hours) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  max="168"
                  value={intervalHours}
                  onChange={(e) => setIntervalHours(parseInt(e.target.value))}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Time between posts</p>
              </div>
            </div>

            <div>
              <Label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date & Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start-date"
                type="datetime-local"
                value={startDate || defaultStartDate()}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn Account <span className="text-red-500">*</span>
              </Label>
              {linkedinAccounts.length > 0 ? (
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {linkedinAccounts.map((account: any) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
                  No LinkedIn accounts connected. Please connect an account first.
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 linkedin-gradient"
                disabled={bulkGenerateMutation.isPending || linkedinAccounts.length === 0}
              >
                {bulkGenerateMutation.isPending ? "Generating..." : `Generate ${count} Posts`}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="text-center py-6 bg-green-50 rounded-lg">
              <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <h3 className="text-lg font-semibold text-green-800">Posts Generated Successfully!</h3>
              <p className="text-green-600 mt-2">
                Generated {result.generated} out of {result.total} posts
              </p>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">Some errors occurred:</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-medium">Scheduling Summary:</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Posts:</span>
                    <span className="ml-2 font-medium">{result.generated}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Interval:</span>
                    <span className="ml-2 font-medium">{intervalHours} hours</span>
                  </div>
                  <div>
                    <span className="text-gray-600">First Post:</span>
                    <span className="ml-2 font-medium">
                      {new Date(startDate).toLocaleDateString()} at {new Date(startDate).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Post:</span>
                    <span className="ml-2 font-medium">
                      {new Date(new Date(startDate).getTime() + (result.generated - 1) * intervalHours * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleReset}
              >
                Generate More
              </Button>
              <Button
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}