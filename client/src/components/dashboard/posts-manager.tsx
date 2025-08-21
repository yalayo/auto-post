import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PostActions } from "./post-actions";
import { Search, Filter, Calendar, FileText } from "lucide-react";

interface PostsManagerProps {
  userId: string;
}

export default function PostsManager({ userId }: PostsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: posts, isLoading } = useQuery({
    queryKey: ['/api/user', userId, 'posts'],
    enabled: !!userId,
  });

  const allPosts = (posts as any[]) || [];

  // Filter and sort posts
  const filteredPosts = allPosts
    .filter(post => {
      const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (post.hashtags && post.hashtags.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || post.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "scheduled":
          if (!a.scheduledAt && !b.scheduledAt) return 0;
          if (!a.scheduledAt) return 1;
          if (!b.scheduledAt) return -1;
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'professional':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'casual':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inspirational':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'educational':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusCounts = () => {
    const counts = allPosts.reduce((acc, post) => {
      acc[post.status] = (acc[post.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      all: allPosts.length,
      draft: counts.draft || 0,
      scheduled: counts.scheduled || 0,
      published: counts.published || 0,
      failed: counts.failed || 0,
    };
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">All Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            All Posts ({filteredPosts.length})
          </CardTitle>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Manage Content</span>
          </div>
        </div>
        
        {/* Status Overview */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Total: {statusCounts.all}
          </Badge>
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Drafts: {statusCounts.draft}
          </Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Scheduled: {statusCounts.scheduled}
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Published: {statusCounts.published}
          </Badge>
          {statusCounts.failed > 0 && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Failed: {statusCounts.failed}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search posts by content or hashtags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="scheduled">By Schedule</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Posts List */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              {searchTerm || statusFilter !== "all" ? "No posts match your filters" : "No posts yet"}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Create your first AI-generated post to get started"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post: any) => (
              <div
                key={post.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(post.status)}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </Badge>
                    <Badge variant="outline" className={getToneColor(post.tone)}>
                      {post.tone.charAt(0).toUpperCase() + post.tone.slice(1)}
                    </Badge>
                  </div>
                  <PostActions post={post} userId={userId} />
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-900 line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {post.hashtags && (
                  <div className="mb-3">
                    <p className="text-xs text-blue-600 font-medium">
                      {post.hashtags}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>Created: {formatDate(post.createdAt)}</span>
                    {post.scheduledAt && (
                      <span>Scheduled: {formatDate(post.scheduledAt)}</span>
                    )}
                    {post.publishedAt && (
                      <span>Published: {formatDate(post.publishedAt)}</span>
                    )}
                  </div>
                  
                  {post.metrics && (
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                        <span>{post.metrics.likes || 0}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <span>{post.metrics.comments || 0}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}